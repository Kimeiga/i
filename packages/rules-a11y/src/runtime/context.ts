import type { PackContext, ScanInput } from '@attestci/core'

/**
 * Renders each URL and runs axe-core against the real DOM.
 *
 * axe-core is injected as a page script and driven through `axe.run`, which is
 * the API Deque documents for exactly this. We wrap it and contribute nothing
 * to it: the detection logic is theirs, is better than anything we would write,
 * and is the reason the accessibility community trusts a result at all.
 *
 * Every failure path here returns `skipped` with a reason rather than throwing.
 * A missing browser must produce "runtime accessibility did not run: chromium
 * is not installed", never an empty violation list that reads like a pass.
 */

export interface AxeNodeResult {
  target: string[]
  html: string
  failureSummary?: string
}

export interface AxeViolation {
  id: string
  impact?: 'minor' | 'moderate' | 'serious' | 'critical' | null
  description: string
  help: string
  helpUrl: string
  tags: string[]
  nodes: AxeNodeResult[]
}

export interface PageResult {
  url: string
  violations: AxeViolation[]
  incomplete: AxeViolation[]
}

export interface RuntimeA11yContext {
  pages: PageResult[]
  axeVersion: string
  /** All failing nodes for one axe rule id, across every page scanned. */
  violationsFor(axeRuleId: string): Array<{ url: string; violation: AxeViolation; node: AxeNodeResult }>
  /**
   * Nodes axe could not decide about. Surfaced separately and never counted as
   * findings — "needs review" is not "fails".
   */
  incompleteFor(axeRuleId: string): Array<{ url: string; violation: AxeViolation; node: AxeNodeResult }>
}

export interface RuntimeOptions {
  /**
   * Path to a Chromium binary. Set ATTEST_CHROMIUM_PATH when the environment
   * ships its own browser, which CI images increasingly do.
   */
  executablePath?: string
  timeoutMs?: number
  /** Tags passed to axe.run. Defaults to the WCAG 2.1 A and AA sets. */
  axeTags?: string[]
}

export const DEFAULT_AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']

export function makeRuntimeContext(pages: PageResult[], axeVersion: string): RuntimeA11yContext {
  const index = (source: (p: PageResult) => AxeViolation[]) => (axeRuleId: string) => {
    const out: Array<{ url: string; violation: AxeViolation; node: AxeNodeResult }> = []
    for (const page of pages) {
      for (const violation of source(page)) {
        if (violation.id !== axeRuleId) continue
        for (const node of violation.nodes) out.push({ url: page.url, violation, node })
      }
    }
    return out
  }

  return {
    pages,
    axeVersion,
    violationsFor: index((p) => p.violations),
    incompleteFor: index((p) => p.incomplete),
  }
}

export async function createRuntimeContext(
  input: ScanInput,
  options: RuntimeOptions = {},
): Promise<PackContext<RuntimeA11yContext>> {
  if (input.urls.length === 0) {
    return {
      status: 'skipped',
      reason:
        'no URLs were given, so no page was rendered. Pass --url to check a running application.',
    }
  }

  let chromium: typeof import('playwright').chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    return {
      status: 'skipped',
      reason: 'playwright is not installed; run `npm i -D playwright` to enable runtime checks',
    }
  }

  let axeSource: string
  let axeVersion: string
  try {
    const axe = await import('axe-core')
    const mod = (axe as unknown as { default?: { source: string; version: string } }).default ?? axe
    axeSource = (mod as { source: string }).source
    axeVersion = (mod as { version: string }).version
  } catch {
    return { status: 'skipped', reason: 'axe-core could not be loaded' }
  }

  const executablePath = options.executablePath ?? process.env.ATTEST_CHROMIUM_PATH
  let browser
  try {
    browser = await chromium.launch(executablePath ? { executablePath } : {})
  } catch (err) {
    return {
      status: 'skipped',
      reason:
        `chromium could not be launched (${firstLine(err)}). Run \`npx playwright install chromium\`, ` +
        `or set ATTEST_CHROMIUM_PATH to an existing binary.`,
    }
  }

  const pages: PageResult[] = []
  const failures: string[] = []

  try {
    const context = await browser.newContext()
    for (const url of input.urls) {
      const page = await context.newPage()
      try {
        await page.goto(url, { waitUntil: 'load', timeout: options.timeoutMs ?? 30_000 })
        await page.addScriptTag({ content: axeSource })
        const tags = options.axeTags ?? DEFAULT_AXE_TAGS
        const result = (await page.evaluate(
          ([runTags]) =>
            (window as unknown as { axe: { run: (ctx: Document, o: unknown) => Promise<unknown> } }).axe.run(
              document,
              { runOnly: { type: 'tag', values: runTags } },
            ),
          [tags] as const,
        )) as { violations: AxeViolation[]; incomplete: AxeViolation[] }

        pages.push({ url, violations: result.violations, incomplete: result.incomplete })
      } catch (err) {
        failures.push(`${url} (${firstLine(err)})`)
      } finally {
        await page.close().catch(() => {})
      }
    }
  } finally {
    await browser.close().catch(() => {})
  }

  if (pages.length === 0) {
    return {
      status: 'skipped',
      reason: `no page could be rendered: ${failures.join('; ') || 'unknown error'}`,
    }
  }

  // A partial run is still a run, but the pages that failed must be visible or
  // the coverage statement is wrong.
  const label = failures.length > 0 ? `pages rendered (${failures.length} failed: ${failures.join('; ')})` : 'pages rendered'

  return {
    status: 'ready',
    context: makeRuntimeContext(pages, axeVersion),
    units: { count: pages.length, label },
  }
}

function firstLine(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  return message.split('\n')[0] ?? message
}
