#!/usr/bin/env node
/**
 * The GitHub Action entry point.
 *
 * Plain ESM with no dependencies and no build step: the action runs the
 * published CLI through npx and talks to the GitHub API with fetch. There is no
 * bundled `dist` to go stale, and someone auditing what this runs in their CI
 * reads one file.
 *
 * The base scan is done in a git worktree of the merge base rather than a
 * second checkout, so the comparison is against the branch this pull request
 * actually targets. When the base cannot be checked out — a shallow clone, a
 * first commit, a fork without history — the run degrades to reporting the head
 * scan on its own and says so, rather than inventing a baseline.
 */

import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { appendFile, mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const exec = promisify(execFile)

const COMMENT_MARKER = '<!-- attest:pr-comment:v1 -->'

const env = process.env
const cliVersion = env.ATTEST_CLI_VERSION || 'latest'
const directory = env.ATTEST_DIRECTORY || '.'
const failOn = env.ATTEST_FAIL_ON || 'serious'
const failOnNewOnly = (env.ATTEST_FAIL_ON_NEW_ONLY || 'true') === 'true'
const wantComment = (env.ATTEST_COMMENT || 'true') === 'true'
const sarifFile = env.ATTEST_SARIF_FILE || ''
const urls = (env.ATTEST_URLS || '')
  .split(/\r?\n/)
  .map((u) => u.trim())
  .filter(Boolean)

const workDir = await mkdtemp(join(tmpdir(), 'attest-action-'))
const headReport = join(workDir, 'head.json')
const baseReport = join(workDir, 'base.json')
const diffJson = join(workDir, 'diff.json')
const commentFile = join(workDir, 'comment.md')

let exitCode = 0

try {
  await scan(directory, headReport, { sarif: sarifFile })

  const baseSha = await resolveBaseSha()
  let haveBase = false
  if (baseSha) {
    haveBase = await scanBase(baseSha)
  }

  await setOutput('report', headReport)

  if (haveBase) {
    await runCli(['diff', baseReport, headReport, '--format', 'json', '--output', diffJson])
    await runCli([
      'diff',
      baseReport,
      headReport,
      '--format',
      'markdown',
      '--output',
      commentFile,
      '--file-url-base',
      fileUrlBase(),
    ])

    const diff = JSON.parse(await readFile(diffJson, 'utf8'))
    const newFindings =
      diff.accessibility.added.length + diff.privacy.added.length + diff.clientImpact.added.length

    await setOutput('diff', diffJson)
    await setOutput('verdict', diff.verdict)
    await setOutput('new-findings', String(newFindings))
    await summarize(await readFile(commentFile, 'utf8'))
    if (wantComment) await upsertComment(await readFile(commentFile, 'utf8'))

    // With fail-on-new-only, the gate is the diff: an existing codebase adopts
    // the check without having to fix everything first, which is the only way
    // adoption ever happens.
    if (failOnNewOnly) {
      exitCode = newFindings > 0 && aboveThreshold(diff, failOn) ? 1 : 0
    } else {
      exitCode = await scanExitCode(directory)
    }
  } else {
    await setOutput('verdict', 'unknown')
    await setOutput('new-findings', '0')
    const note = baseSha
      ? `Could not check out the base commit \`${baseSha.slice(0, 8)}\`, so this run reports the current state rather than what changed. A shallow checkout is the usual cause: set \`fetch-depth: 0\` on actions/checkout.`
      : 'No base commit to compare against, so this run reports the current state rather than what changed.'
    const body = `${COMMENT_MARKER}\n\n### Attest\n\n${note}\n\n${await summaryOf(headReport)}`
    await summarize(body)
    if (wantComment && isPullRequest()) await upsertComment(body)
    exitCode = await scanExitCode(directory)
  }
} catch (error) {
  console.error(`::error::Attest failed to run: ${error instanceof Error ? error.message : error}`)
  // A crash in the tool is not a finding about the user's code. Fail the step
  // so the problem is visible, but never claim the code was checked.
  exitCode = 1
} finally {
  await rm(workDir, { recursive: true, force: true }).catch(() => {})
}

process.exit(exitCode)

/* --------------------------------- steps -------------------------------- */

async function scan(dir, output, { sarif } = {}) {
  const args = ['scan', dir, '--json', output, '--fail-on', 'never']
  for (const url of urls) args.push('--url', url)
  if (env.ATTEST_BUILD_DIR) args.push('--build-dir', env.ATTEST_BUILD_DIR)
  if (sarif) args.push('--sarif', sarif)
  await runCli(args)
}

/** Runs the scan again purely to get its exit code under the real threshold. */
async function scanExitCode(dir) {
  const args = ['scan', dir, '--fail-on', failOn, '-q']
  for (const url of urls) args.push('--url', url)
  const code = await runCli(args, { allowFailure: true })
  return code === 1 ? 1 : 0
}

async function scanBase(baseSha) {
  const worktree = join(workDir, 'base-tree')
  try {
    await exec('git', ['fetch', '--no-tags', '--depth', '1', 'origin', baseSha])
  } catch {
    // Already present, or the remote will not serve it; try the worktree anyway.
  }
  try {
    await exec('git', ['worktree', 'add', '--detach', worktree, baseSha])
  } catch (error) {
    console.log(`::notice::Attest could not check out the base commit: ${error.message.split('\n')[0]}`)
    return false
  }

  try {
    const target = directory === '.' ? worktree : join(worktree, directory)
    if (!existsSync(target)) return false
    // The base scan deliberately skips URLs: the base branch is not running
    // anywhere, and a runtime layer that ran on one side only would be excluded
    // from the diff regardless.
    await runCli(['scan', target, '--json', baseReport, '--fail-on', 'never', '-q'])
    return true
  } finally {
    await exec('git', ['worktree', 'remove', '--force', worktree]).catch(() => {})
  }
}

function aboveThreshold(diff, threshold) {
  if (threshold === 'never') return false
  const order = ['minor', 'moderate', 'serious', 'critical']
  const min = order.indexOf(threshold)
  const added = [...diff.accessibility.added, ...diff.privacy.added, ...diff.clientImpact.added]
  return added.some((f) => order.indexOf(f.severity) >= min)
}

async function summaryOf(reportPath) {
  const report = JSON.parse(await readFile(reportPath, 'utf8'))
  const counts = report.findings.length
  const skipped = report.coverage.layers.filter((l) => !l.ran)
  const lines = [`${counts} finding${counts === 1 ? '' : 's'} from the checks that ran.`]
  if (skipped.length > 0) {
    lines.push('', 'Checks that did not run:')
    for (const layer of skipped) lines.push(`- ${layer.kind}: ${layer.reason ?? 'not applicable'}`)
  }
  lines.push('', `_${report.disclaimer}_`)
  return lines.join('\n')
}

/* --------------------------------- github -------------------------------- */

function isPullRequest() {
  return env.GITHUB_EVENT_NAME === 'pull_request' || env.GITHUB_EVENT_NAME === 'pull_request_target'
}

function fileUrlBase() {
  const sha = env.GITHUB_SHA ?? 'HEAD'
  return `${env.GITHUB_SERVER_URL ?? 'https://github.com'}/${env.GITHUB_REPOSITORY}/blob/${sha}`
}

async function resolveBaseSha() {
  if (!isPullRequest()) return undefined
  try {
    const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'))
    return event.pull_request?.base?.sha
  } catch {
    return undefined
  }
}

/**
 * One comment per pull request, edited in place. A bot that adds a comment per
 * push is a bot people mute, and a muted check is not a check.
 */
async function upsertComment(body) {
  const token = env.GITHUB_TOKEN
  if (!token) {
    console.log('::notice::No token available, skipping the pull request comment.')
    return
  }
  if (!isPullRequest()) return

  const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'))
  const number = event.pull_request?.number
  if (!number) return

  const api = `${env.GITHUB_API_URL ?? 'https://api.github.com'}/repos/${env.GITHUB_REPOSITORY}`
  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'content-type': 'application/json',
    'user-agent': 'attest-action',
  }

  try {
    const existing = await fetch(`${api}/issues/${number}/comments?per_page=100`, { headers })
    if (existing.ok) {
      const comments = await existing.json()
      const mine = comments.find((c) => typeof c.body === 'string' && c.body.includes(COMMENT_MARKER))
      if (mine) {
        await fetch(`${api}/issues/comments/${mine.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ body }),
        })
        return
      }
    }
    await fetch(`${api}/issues/${number}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body }),
    })
  } catch (error) {
    // A comment we could not post is a nuisance, not a reason to fail the build.
    console.log(`::notice::Attest could not post the pull request comment: ${error.message}`)
  }
}

async function summarize(markdown) {
  if (!env.GITHUB_STEP_SUMMARY) return
  await appendFile(env.GITHUB_STEP_SUMMARY, `${markdown}\n`).catch(() => {})
}

async function setOutput(name, value) {
  if (!env.GITHUB_OUTPUT) return
  await appendFile(env.GITHUB_OUTPUT, `${name}=${value}\n`).catch(() => {})
}

/* ---------------------------------- cli ---------------------------------- */

function runCli(args, { allowFailure = false } = {}) {
  const local = env.ATTEST_CLI_BIN
  const command = local ? process.execPath : 'npx'
  const fullArgs = local ? [local, ...args] : ['--yes', `@attestci/cli@${cliVersion}`, ...args]

  return new Promise((resolve, reject) => {
    const child = spawn(command, fullArgs, { stdio: 'inherit', env: process.env })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0 || allowFailure) resolve(code ?? 0)
      else reject(new Error(`attest ${args[0]} exited with code ${code}`))
    })
  })
}
