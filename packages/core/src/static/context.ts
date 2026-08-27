import type { SourceFile } from 'ts-morph'
import type { PackContext, ScanInput } from '../types.js'
import { getStaticProject, type StaticProject } from './project.js'
import { buildClientGraph, isRouteHandler, leadingDirective, type ClientGraph } from './client-graph.js'

/**
 * The context every static rule receives.
 *
 * A rule author should be able to write a useful rule using nothing but this
 * object and the helpers in `jsx.ts` — that is the concrete meaning of the
 * "a rule ships in one 90-minute session" constraint. If a rule needs something
 * that is not here, add it here rather than reaching into ts-morph inside the
 * rule, so the next rule gets it for free.
 */
export interface StaticContext {
  rootDir: string
  project: StaticProject
  files: SourceFile[]
  clientGraph: ClientGraph
  /** Repo-relative POSIX path. */
  relative(file: SourceFile): string
  /** Does this module end up in the browser bundle? */
  isClientReachable(file: SourceFile): boolean
  /** Does this module carry an explicit `'use client'`? */
  isClientBoundary(file: SourceFile): boolean
  /** `app/**\/route.ts` or `pages/api/*`. */
  isRouteHandler(file: SourceFile): boolean
  /** Module or function marked `'use server'`. */
  isServerActionModule(file: SourceFile): boolean
  /** Server-side module in the App Router that is not client-reachable. */
  isServerOnly(file: SourceFile): boolean
}

const CONTEXT_KEY = 'attestci/core:static-context'

/**
 * Builds the static context once per scan and shares it between packs.
 *
 * Returns `skipped` rather than an empty context when there is nothing to
 * analyse, so the report says "no source files matched" instead of implying a
 * clean result.
 */
export async function createStaticContext(input: ScanInput): Promise<PackContext<StaticContext>> {
  const cached = input.shared.get(CONTEXT_KEY) as StaticContext | undefined
  if (cached) {
    return { status: 'ready', context: cached, units: { count: cached.files.length, label: 'source files' } }
  }

  if (input.files.length === 0) {
    return {
      status: 'skipped',
      reason: 'no source files matched the include patterns',
    }
  }

  const project = await getStaticProject(input)
  if (project.sourceFiles.length === 0) {
    return { status: 'skipped', reason: 'no source files could be parsed' }
  }

  const clientGraph = buildClientGraph(project)

  const context: StaticContext = {
    rootDir: input.rootDir,
    project,
    files: project.sourceFiles,
    clientGraph,
    relative: (file) => project.relative(file),
    isClientReachable: (file) => clientGraph.reachable.has(file.getFilePath()),
    isClientBoundary: (file) => clientGraph.roots.has(file.getFilePath()),
    isRouteHandler: (file) => isRouteHandler(project.relative(file)),
    isServerActionModule: (file) => clientGraph.serverActionModules.has(file.getFilePath()),
    isServerOnly: (file) =>
      !clientGraph.reachable.has(file.getFilePath()) && leadingDirective(file) !== 'use client',
  }

  input.shared.set(CONTEXT_KEY, context)
  return {
    status: 'ready',
    context,
    units: { count: context.files.length, label: 'source files' },
  }
}
