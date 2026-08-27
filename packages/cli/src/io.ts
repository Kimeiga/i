/**
 * Everything the CLI writes goes through here.
 *
 * Two reasons. Tests assert on output without capturing global streams, and
 * the split is enforced: reports go to stdout, everything else to stderr, so
 * `attest scan --format json > report.json` produces a file that parses.
 */
export interface CliIo {
  out(line: string): void
  error(line: string): void
}

export const consoleIo: CliIo = {
  out: (line) => process.stdout.write(`${line}\n`),
  error: (line) => process.stderr.write(`${line}\n`),
}

export function collectingIo(): CliIo & { stdout: string[]; stderr: string[] } {
  const stdout: string[] = []
  const stderr: string[] = []
  return {
    stdout,
    stderr,
    out: (line) => stdout.push(line),
    error: (line) => stderr.push(line),
  }
}
