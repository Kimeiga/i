import { parseArgs } from 'node:util'
import {
  ATTRIBUTION,
  AUTOMATED_COVERAGE_NOTE,
  CANONICAL_CLAIM,
  ConfigError,
  DOCS_URL,
  PRODUCT_NAME,
  PRODUCT_SLUG,
  ReportFormatError,
  wrap,
  type Severity,
} from '@attestci/core'
import { scanCommand } from './commands/scan.js'
import { diffCommand } from './commands/diff.js'
import { badgeCommand } from './commands/badge.js'
import { explainCommand, rulesCommand } from './commands/rules.js'
import { initCommand } from './commands/init.js'
import { consoleIo, type CliIo } from './io.js'
import { VERSION } from './version.js'

/**
 * Argument parsing and dispatch.
 *
 * Built on node:util's parseArgs rather than a CLI framework. The install
 * weight of this package is a distribution cost — people run it through npx
 * before they trust it — and a dependency-free CLI installs in a second.
 */
export async function runCli(argv: string[], io: CliIo = consoleIo): Promise<number> {
  try {
    return await dispatch(argv, io)
  } catch (err) {
    if (err instanceof ConfigError || err instanceof ReportFormatError) {
      io.error(`${PRODUCT_NAME}: ${err.message}`)
      return 2
    }
    if (err instanceof TypeError && /Unknown option|not allowed/i.test(err.message)) {
      io.error(`${PRODUCT_NAME}: ${err.message}`)
      io.error(`Run \`${PRODUCT_SLUG} --help\` for usage.`)
      return 2
    }
    io.error(`${PRODUCT_NAME}: ${err instanceof Error ? err.stack ?? err.message : String(err)}`)
    return 2
  }
}

async function dispatch(argv: string[], io: CliIo): Promise<number> {
  const [command, ...rest] = argv

  if (command === undefined || command === '--help' || command === '-h' || command === 'help') {
    printHelp(io)
    return command === undefined ? 2 : 0
  }
  if (command === '--version' || command === '-v' || command === 'version') {
    io.out(VERSION)
    return 0
  }

  switch (command) {
    case 'scan':
      return scan(rest, io)
    case 'diff':
      return diff(rest, io)
    case 'badge':
      return badge(rest, io)
    case 'rules':
      return rules(rest, io)
    case 'explain': {
      const id = rest[0]
      if (!id) {
        io.error('Usage: attest explain <rule-id>')
        return 2
      }
      return explainCommand(id, io)
    }
    case 'init':
      return init(rest, io)
    default:
      io.error(`Unknown command "${command}".`)
      printHelp(io)
      return 2
  }
}

async function scan(argv: string[], io: CliIo): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      url: { type: 'string', multiple: true },
      'build-dir': { type: 'string' },
      config: { type: 'string' },
      json: { type: 'string' },
      sarif: { type: 'string' },
      markdown: { type: 'string' },
      baseline: { type: 'string' },
      'fail-on': { type: 'string' },
      'fail-on-new-only': { type: 'boolean' },
      'chromium-path': { type: 'string' },
      format: { type: 'string' },
      quiet: { type: 'boolean', short: 'q' },
    },
  })

  const failOn = values['fail-on'] as Severity | 'never' | undefined
  const format = (values.format as string | undefined) ?? 'terminal'
  if (format !== 'terminal' && format !== 'json') {
    io.error('--format must be "terminal" or "json"')
    return 2
  }

  return scanCommand(
    {
      dir: positionals[0] ?? '.',
      urls: (values.url as string[] | undefined) ?? [],
      buildDir: values['build-dir'] as string | undefined,
      configPath: values.config as string | undefined,
      json: values.json as string | undefined,
      sarif: values.sarif as string | undefined,
      markdown: values.markdown as string | undefined,
      baseline: values.baseline as string | undefined,
      failOn,
      failOnNewOnly: values['fail-on-new-only'] as boolean | undefined,
      chromiumPath: values['chromium-path'] as string | undefined,
      quiet: values.quiet as boolean | undefined,
      format,
    },
    io,
  )
}

async function diff(argv: string[], io: CliIo): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      format: { type: 'string' },
      output: { type: 'string', short: 'o' },
      'fail-on-regression': { type: 'boolean' },
      'dashboard-url': { type: 'string' },
      'file-url-base': { type: 'string' },
    },
  })

  const [base, head] = positionals
  if (!base || !head) {
    io.error('Usage: attest diff <base-report.json> <head-report.json>')
    return 2
  }

  const format = ((values.format as string | undefined) ?? 'terminal') as 'terminal' | 'markdown' | 'json'
  if (!['terminal', 'markdown', 'json'].includes(format)) {
    io.error('--format must be "terminal", "markdown" or "json"')
    return 2
  }

  return diffCommand(
    {
      base,
      head,
      format,
      output: values.output as string | undefined,
      failOnRegression: values['fail-on-regression'] as boolean | undefined,
      dashboardUrl: values['dashboard-url'] as string | undefined,
      fileUrlBase: values['file-url-base'] as string | undefined,
    },
    io,
  )
}

async function badge(argv: string[], io: CliIo): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      output: { type: 'string', short: 'o' },
      label: { type: 'string' },
    },
  })

  const report = positionals[0]
  if (!report) {
    io.error('Usage: attest badge <report.json> [--output badge.svg]')
    return 2
  }
  return badgeCommand(
    { report, output: values.output as string | undefined, label: values.label as string | undefined },
    io,
  )
}

function rules(argv: string[], io: CliIo): number {
  const { values } = parseArgs({
    args: argv,
    options: { json: { type: 'boolean' }, kind: { type: 'string' } },
  })
  return rulesCommand({ json: values.json as boolean | undefined, kind: values.kind as string | undefined }, io)
}

async function init(argv: string[], io: CliIo): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { force: { type: 'boolean' } },
  })
  return initCommand({ dir: positionals[0] ?? '.', force: values.force as boolean | undefined }, io)
}

function printHelp(io: CliIo): void {
  io.out(`${PRODUCT_NAME} ${VERSION}`)
  io.out('')
  io.out(wrap(CANONICAL_CLAIM, 88))
  io.out('')
  io.out(`Usage: ${PRODUCT_SLUG} <command> [options]`)
  io.out('')
  io.out('Commands')
  io.out('  scan [dir]                 Run the checks over a directory')
  io.out('  diff <base> <head>         Compare two reports and describe what changed')
  io.out('  badge <report>             Render an SVG badge from a report')
  io.out('  rules                      List the rules this build ships')
  io.out('  explain <rule-id>          Explain one rule in full')
  io.out('  init [dir]                 Write a config file')
  io.out('')
  io.out('scan options')
  io.out('  --url <url>                Render this URL and run axe-core against it (repeatable)')
  io.out('  --build-dir <path>         Next.js build output to measure (default .next if present)')
  io.out('  --json <path>              Write the full report as JSON')
  io.out('  --sarif <path>             Write SARIF 2.1.0 for code scanning')
  io.out('  --markdown <path>          Write a human-readable report')
  io.out('  --baseline <report.json>   Compare against a previous report and show the diff')
  io.out('  --fail-on <severity>       minor | moderate | serious | critical | never (default serious)')
  io.out('  --fail-on-new-only         Only fail on findings absent from the baseline')
  io.out('  --chromium-path <path>     Browser binary for the runtime checks')
  io.out('  --format terminal|json     Output format (default terminal)')
  io.out('  -q, --quiet                Suppress progress output')
  io.out('')
  io.out('diff options')
  io.out('  --format terminal|markdown|json')
  io.out('  -o, --output <path>        Write to a file instead of stdout')
  io.out('  --fail-on-regression       Exit 1 when the diff introduces findings')
  io.out('')
  io.out('Exit codes')
  io.out('  0  no findings at or above the threshold')
  io.out('  1  findings at or above the threshold')
  io.out('  2  usage, configuration or report format error')
  io.out('')
  io.out(wrap(AUTOMATED_COVERAGE_NOTE, 88))
  io.out('')
  io.out(wrap(ATTRIBUTION, 88))
  io.out('')
  io.out(`Docs: ${DOCS_URL}`)
}
