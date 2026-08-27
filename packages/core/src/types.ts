/**
 * The public contract every rule implements, and the shape of everything a
 * scan produces.
 *
 * Design constraint driving this file: adding a rule must never require
 * editing the engine, and a rule must be writable, testable, documented and
 * shippable inside one 90-minute session. That means a rule is a plain object
 * with a `check` function and static metadata — no lifecycle hooks, no
 * registration side effects, no engine coupling. See DECISIONS.md ADR-0004.
 */

/** Ordered least to most severe; the ordering is load-bearing for gating. */
export const SEVERITIES = ['minor', 'moderate', 'serious', 'critical'] as const
export type Severity = (typeof SEVERITIES)[number]

export function severityRank(s: Severity): number {
  return SEVERITIES.indexOf(s)
}

/**
 * The three detection layers from the architecture, plus the split of the
 * accessibility layer into "needs a browser" and "does not".
 *
 * These are genuinely different analyses with different evidentiary weight and
 * must not be conflated in reports:
 *  - `runtime-a11y` observes the real DOM and is authoritative for WCAG.
 *  - `static-a11y` reads source and catches a narrower set earlier, with no
 *    browser. It can produce findings a rendered page would not (dead code) and
 *    misses anything that depends on runtime state.
 *  - `static-privacy` reads source for boundary violations no renderer can see.
 *  - `client-impact` covers delivery cost: startup JavaScript and data
 *    waterfalls, sourced from build artifacts or from source where the
 *    artifact does not carry the information.
 */
export type RuleKind = 'runtime-a11y' | 'static-a11y' | 'static-privacy' | 'client-impact'

/** Top-level grouping used by the semantic diff's three sections. */
export type Domain = 'accessibility' | 'privacy' | 'client-impact'

export function domainOf(kind: RuleKind): Domain {
  switch (kind) {
    case 'runtime-a11y':
    case 'static-a11y':
      return 'accessibility'
    case 'static-privacy':
      return 'privacy'
    case 'client-impact':
      return 'client-impact'
  }
}

/**
 * A reference to an external standard, or to an internal privacy property.
 *
 * `privacy-property` exists because no published standard enumerates the
 * boundaries we check (session scope, retry idempotency, request lifetime).
 * Labelling them honestly as our own definitions — rather than dressing them up
 * as GDPR articles — is deliberate.
 */
export interface StandardRef {
  framework: 'wcag21' | 'en301549' | 'privacy-property'
  /** e.g. '1.3.1' for WCAG, '9.1.3.1' for EN 301 549, or a property slug. */
  id: string
  level?: 'A' | 'AA' | 'AAA'
  title: string
  url?: string
}

export interface SourceLocation {
  kind: 'source'
  /** Repo-relative, POSIX separators. Normalised by the engine. */
  file: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
}

export interface DomLocation {
  kind: 'dom'
  url: string
  /** CSS selector path as reported by axe-core. */
  selector: string
  /** Truncated outerHTML for human review. */
  html?: string
}

export interface ArtifactLocation {
  kind: 'artifact'
  /** e.g. '.next/app-build-manifest.json' */
  artifact: string
  /** e.g. a route or chunk name within the artifact. */
  entry?: string
}

export type FindingLocation = SourceLocation | DomLocation | ArtifactLocation

export interface Finding {
  ruleId: string
  kind: RuleKind
  severity: Severity
  /** Rule-level title, copied from the rule for self-contained reports. */
  title: string
  /** Instance-specific description of what was found here. */
  message: string
  location: FindingLocation
  /** The offending code or markup, truncated. Never include secret values. */
  evidence?: string
  /** How to fix it, in one or two sentences. */
  help: string
  helpUrl: string
  standards: StandardRef[]
  /**
   * Stable identity for this finding across commits. Deliberately excludes
   * line and column so that unrelated edits above a finding do not present it
   * as "new" in the diff. This is what makes the diff semantic rather than
   * textual. Computed by the engine, not by rules.
   */
  fingerprint: string
  /**
   * Human-meaningful grouping key: `checkout/PaymentForm`, `app/(shop)/cart`.
   * Drives the "what changed about this part of the app" framing.
   */
  surface: string
  /**
   * Set by privacy rules that can name the transition they detected. This is
   * what turns a lint error into a statement about the system:
   * `{ subject: 'customer_profile', from: 'session-private', to: 'reachable
   * from public cache' }` renders as one line a non-engineer can act on.
   */
  boundary?: { subject: string; from: string; to: string }
}

/** A finding as a rule emits it: no fingerprint, no normalised paths yet. */
export type RawFinding = Omit<
  Finding,
  'fingerprint' | 'ruleId' | 'kind' | 'title' | 'helpUrl' | 'standards' | 'severity'
> & {
  /** Rules may escalate or de-escalate per instance; defaults to rule severity. */
  severity?: Severity
  /** Rules may narrow the standards list per instance. */
  standards?: StandardRef[]
}

export interface RuleFixtures {
  /** Paths, relative to the repo root, that MUST produce at least one finding. */
  triggering: readonly string[]
  /** Paths that MUST produce none. These are the false-positive guard. */
  clean: readonly string[]
}

/**
 * A rule. `Ctx` is supplied by the pack that owns the rule, so core never
 * needs to know about ts-morph, Playwright, or axe-core.
 */
export interface Rule<Ctx = unknown> {
  /** Namespaced and stable forever once published: `a11y/img-alt`. */
  readonly id: string
  readonly kind: RuleKind
  readonly title: string
  /** One paragraph: what it detects and why that matters. Used in docs. */
  readonly description: string
  readonly severity: Severity
  /** Docs page slug, must match a file in docs/rules/<slug>.md. */
  readonly docs: string
  readonly standards: readonly StandardRef[]
  readonly fixtures: RuleFixtures
  /**
   * Set when a rule is known to over-report in some shapes of codebase. Such
   * rules are off unless explicitly enabled. Being honest here is cheaper than
   * losing a user to a false positive.
   */
  readonly experimental?: boolean
  check(ctx: Ctx): RawFinding[] | Promise<RawFinding[]>
}

export type AnyRule = Rule<any>

/**
 * A group of rules that share a context and a way of building it.
 *
 * `createContext` returning `null` means "this analysis does not apply to this
 * scan" (no URLs given, no build output present, browsers not installed). The
 * engine records that as an explicit skip rather than silently reporting a
 * clean result — a scan that could not look is not a scan that found nothing.
 */
export interface RulePack<Ctx = unknown> {
  readonly id: string
  readonly kind: RuleKind
  readonly rules: readonly Rule<Ctx>[]
  createContext(input: ScanInput): Promise<PackContext<Ctx>>
}

export type PackContext<Ctx> =
  | {
      status: 'ready'
      context: Ctx
      /** What the layer actually examined, for the honest coverage statement. */
      units?: { count: number; label: string }
    }
  | { status: 'skipped'; reason: string }

export type AnyRulePack = RulePack<any>

export interface ScanInput {
  /** Absolute path to the repository root being scanned. */
  rootDir: string
  /** Repo-relative source file paths, already filtered by include/exclude. */
  files: readonly string[]
  /** URLs to render and evaluate with axe-core. Empty means no runtime scan. */
  urls: readonly string[]
  /** Path to build output, e.g. `<root>/.next`. Absent means no build analysis. */
  buildDir?: string
  /** Baseline build metrics for delta computation, if the caller has them. */
  baselineBuildDir?: string
  config: ResolvedConfig
  /**
   * Scratch space shared between packs within a single scan.
   *
   * It exists for exactly one reason: parsing a large TypeScript project is the
   * most expensive thing a scan does, and the accessibility and privacy packs
   * both need the same parse. The first pack to need it builds it and leaves it
   * here; the second reuses it. Keys are namespaced strings owned by whoever
   * defines them (see `@attestci/core/static`). Nothing in the engine reads it.
   */
  shared: Map<string, unknown>
}

export interface ResolvedConfig {
  include: readonly string[]
  exclude: readonly string[]
  urls: readonly string[]
  /** Rule ids or `pack:` prefixes to disable. */
  disabledRules: readonly string[]
  /** Explicitly enable experimental rules. */
  enabledExperimental: readonly string[]
  /** Findings at or above this severity fail the run. */
  failOn: Severity | 'never'
  /** Fail only on findings that are new relative to the baseline report. */
  failOnNewOnly: boolean
  buildDir?: string
  baselineReport?: string
}

export interface RuleSkip {
  ruleId: string
  reason: string
}

export interface CoverageStatement {
  /** Which layers actually ran. Absent layers are stated, not implied clean. */
  layers: Array<{
    kind: RuleKind
    ran: boolean
    reason?: string
    rulesRun: number
    unitsExamined: number
    unitLabel: string
  }>
  note: string
}

export interface BuildMetrics {
  /**
   * First-load JavaScript per route, in bytes: the union of the chunk files
   * the build manifest lists for that route. This is what a visitor downloads
   * before the route is interactive, and it is the number that moves when
   * someone adds a client component.
   */
  startupJsBytes?: Record<string, number>
  /**
   * Bytes in the union of every route's chunk set. Not the sum of the per-route
   * numbers: shared chunks are counted once, because they are downloaded once.
   */
  totalStartupJsBytes?: number
  /** Which manifest the numbers came from, so the figure is auditable. */
  source?: string
}

/**
 * A finding that a rule produced and a source comment waived.
 *
 * Suppressions are recorded in the report rather than dropped. A tool whose
 * output can be silenced invisibly is worthless as evidence: the question a
 * regulator asks is "what did you know and what did you do about it", and
 * "a developer waived it on 3 March with this reason" is a much better answer
 * than a report that never mentions it.
 */
export interface SuppressedFinding {
  ruleId: string
  fingerprint: string
  surface: string
  location: FindingLocation
  severity: Severity
  /** Empty string when the developer gave no reason. */
  reason: string
  directive: SuppressionDirective
}

export type SuppressionDirective = 'disable-next-line' | 'disable-line' | 'disable-file'

export interface ScanReport {
  schemaVersion: '1'
  tool: { name: string; version: string }
  scan: {
    id: string
    startedAt: string
    finishedAt: string
    durationMs: number
  }
  target: {
    rootDir: string
    repository?: string
    commit?: string
    ref?: string
    urls: readonly string[]
  }
  rulesRun: readonly string[]
  rulesSkipped: readonly RuleSkip[]
  findings: readonly Finding[]
  suppressed: readonly SuppressedFinding[]
  metrics: BuildMetrics
  coverage: CoverageStatement
  disclaimer: string
  /**
   * SHA-256 over the canonical form of everything that describes *what was
   * found*: findings, suppressions, metrics, coverage, the rule set that ran,
   * and the tool version. Deliberately excluded are wall-clock fields, the
   * scan id, absolute paths, and the git revision — so two scans of identical
   * code produce an identical hash even on different machines or branches.
   * That property is what lets a third party recompute and check it.
   */
  contentHash: string
}

/* ---------------------------------- diff --------------------------------- */

export interface SurfaceDelta {
  surface: string
  added: readonly Finding[]
  removed: readonly Finding[]
  persisting: readonly Finding[]
}

export interface BoundaryChange {
  subject: string
  from: string
  to: string
  ruleId: string
  finding: Finding
}

export interface ClientImpact {
  /** Undefined when either side lacked build output; never defaulted to 0. */
  startupJsBytesDelta?: number
  startupJsByRouteDelta?: Record<string, number>
  /** Findings in the client-impact domain, e.g. new eager data waterfalls. */
  added: readonly Finding[]
  removed: readonly Finding[]
  persisting: readonly Finding[]
}

export type DiffVerdict = 'regressed' | 'improved' | 'mixed' | 'unchanged'

export interface SemanticDiff {
  schemaVersion: '1'
  base: { scanId: string; contentHash: string; commit?: string }
  head: { scanId: string; contentHash: string; commit?: string }
  accessibility: {
    added: readonly Finding[]
    removed: readonly Finding[]
    persisting: readonly Finding[]
    bySurface: readonly SurfaceDelta[]
  }
  privacy: {
    added: readonly Finding[]
    removed: readonly Finding[]
    persisting: readonly Finding[]
    boundaryChanges: readonly BoundaryChange[]
  }
  clientImpact: ClientImpact
  verdict: DiffVerdict
  /** Layers that ran in one report but not the other; diffs across them lie. */
  incomparableLayers: readonly RuleKind[]
  disclaimer: string
}
