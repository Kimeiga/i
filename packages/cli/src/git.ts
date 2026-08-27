import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

export interface GitContext {
  commit?: string
  ref?: string
  repository?: string
}

/**
 * Best-effort git metadata for the report header.
 *
 * Every failure path is silent by design: a scan of a directory that is not a
 * git checkout is a perfectly normal thing to do, and refusing to run there —
 * or printing a warning about it — would be noise. The evidence trail records
 * what it knows and says nothing about what it does not.
 *
 * CI environment variables take priority over the local repository, because in
 * a pull request build the checked-out HEAD is often a merge commit that exists
 * nowhere else.
 */
export async function readGitContext(cwd: string): Promise<GitContext> {
  const fromEnv = readFromEnv()
  if (fromEnv.commit && fromEnv.repository) return fromEnv

  const [commit, ref, remote] = await Promise.all([
    git(cwd, ['rev-parse', 'HEAD']),
    git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']),
    git(cwd, ['config', '--get', 'remote.origin.url']),
  ])

  return {
    commit: fromEnv.commit ?? commit,
    ref: fromEnv.ref ?? ref,
    repository: fromEnv.repository ?? normalizeRemote(remote),
  }
}

function readFromEnv(): GitContext {
  const env = process.env
  return {
    // GitHub Actions sets GITHUB_SHA to the merge commit for pull_request
    // events; the head sha is in the event payload, which the Action passes
    // through as ATTEST_COMMIT when it matters.
    commit: env.ATTEST_COMMIT ?? env.GITHUB_SHA ?? env.CI_COMMIT_SHA ?? undefined,
    ref: env.ATTEST_REF ?? env.GITHUB_REF_NAME ?? env.CI_COMMIT_REF_NAME ?? undefined,
    repository: env.ATTEST_REPOSITORY ?? env.GITHUB_REPOSITORY ?? undefined,
  }
}

async function git(cwd: string, args: string[]): Promise<string | undefined> {
  try {
    const { stdout } = await run('git', args, { cwd, timeout: 5000 })
    const value = stdout.trim()
    return value.length > 0 ? value : undefined
  } catch {
    return undefined
  }
}

/** `git@github.com:owner/repo.git` and the https form both become `owner/repo`. */
export function normalizeRemote(remote: string | undefined): string | undefined {
  if (!remote) return undefined
  const match = remote.match(/[/:]([^/:]+\/[^/]+?)(?:\.git)?$/)
  return match?.[1]
}
