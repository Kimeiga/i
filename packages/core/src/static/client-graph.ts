import { Node, type SourceFile } from 'ts-morph'
import { toRelative, type StaticProject } from './project.js'

/**
 * Which modules end up in the browser bundle.
 *
 * This is the analysis the rest of the privacy pack is built on, and it is the
 * thing a per-file linter fundamentally cannot do. `'use client'` marks a
 * boundary, not a file: everything a client module imports is also shipped to
 * the browser, however many hops away it is. A helper five imports deep from a
 * client component that reads `process.env.STRIPE_SECRET_KEY` is a client
 * module, and nothing that looks at one file at a time will ever say so.
 *
 * Caveats, stated because they bound what the findings mean:
 *  - Only static `import`/`export … from` edges are followed. A dynamic
 *    `import()` with a computed specifier is invisible here.
 *  - Modules outside the scanned file set (node_modules) are not traversed, so
 *    a client-reachable secret laundered through a published package is missed.
 *  - Next.js also treats the whole pages/ directory as client-rendered; that is
 *    handled by `isPagesRouterFile`, not by this graph.
 */
export interface ClientGraph {
  /** Files carrying an explicit `'use client'` directive. */
  roots: ReadonlySet<string>
  /** Roots plus everything statically reachable from them. */
  reachable: ReadonlySet<string>
  /** Files carrying an explicit `'use server'` directive. */
  serverActionModules: ReadonlySet<string>
  /** Shortest import chain from a `'use client'` root, for the evidence field. */
  pathToRoot(filePath: string): string[]
}

export function buildClientGraph(project: StaticProject): ClientGraph {
  const roots = new Set<string>()
  const serverActionModules = new Set<string>()
  const byPath = new Map<string, SourceFile>()

  for (const file of project.sourceFiles) {
    const path = file.getFilePath()
    byPath.set(path, file)
    const directive = leadingDirective(file)
    if (directive === 'use client') roots.add(path)
    if (directive === 'use server') serverActionModules.add(path)
  }

  // Pages Router files are client-rendered by definition — there is no
  // `'use client'` to mark them — so they seed the graph too.
  for (const file of project.sourceFiles) {
    if (isPagesRouterFile(project.relative(file))) roots.add(file.getFilePath())
  }

  const reachable = new Set<string>(roots)
  const parent = new Map<string, string>()
  const queue = [...roots]

  while (queue.length > 0) {
    const current = queue.shift()!
    const file = byPath.get(current)
    if (!file) continue
    for (const target of importedFiles(file)) {
      const path = target.getFilePath()
      if (reachable.has(path)) continue
      // A `'use server'` module imported from client code is an RPC boundary,
      // not shipped code: its body stays on the server. Following it would
      // report every server action's internals as client-reachable.
      if (serverActionModules.has(path)) continue
      reachable.add(path)
      parent.set(path, current)
      queue.push(path)
    }
  }

  return {
    roots,
    reachable,
    serverActionModules,
    pathToRoot(filePath: string): string[] {
      const chain: string[] = []
      let current: string | undefined = filePath
      const seen = new Set<string>()
      while (current && !seen.has(current)) {
        seen.add(current)
        chain.push(toRelative(project.rootDir, current))
        if (roots.has(current)) break
        current = parent.get(current)
      }
      return chain
    },
  }
}

/** `'use client'` / `'use server'` when it is the module's first statement. */
export function leadingDirective(file: SourceFile): 'use client' | 'use server' | undefined {
  for (const statement of file.getStatements()) {
    if (!Node.isExpressionStatement(statement)) break
    const expr = statement.getExpression()
    if (!Node.isStringLiteral(expr) && !Node.isNoSubstitutionTemplateLiteral(expr)) break
    const value = expr.getLiteralValue()
    if (value === 'use client' || value === 'use server') return value
    // Some other directive such as 'use strict'; keep looking.
  }
  return undefined
}

function importedFiles(file: SourceFile): SourceFile[] {
  const out: SourceFile[] = []
  for (const decl of file.getImportDeclarations()) {
    const target = decl.getModuleSpecifierSourceFile()
    if (target && !target.isDeclarationFile()) out.push(target)
  }
  for (const decl of file.getExportDeclarations()) {
    const target = decl.getModuleSpecifierSourceFile()
    if (target && !target.isDeclarationFile()) out.push(target)
  }
  return out
}

export function isPagesRouterFile(relativePath: string): boolean {
  return /(^|\/)pages\/(?!api\/)/.test(relativePath)
}

export function isAppRouterFile(relativePath: string): boolean {
  return /(^|\/)app\//.test(relativePath)
}

/** `app/**\/route.ts` — a Route Handler, which runs only on the server. */
export function isRouteHandler(relativePath: string): boolean {
  return /(^|\/)app\/.*\/route\.[cm]?[jt]sx?$/.test(relativePath) ||
    /(^|\/)pages\/api\//.test(relativePath)
}

export function isServerComponentFile(relativePath: string, graph: ClientGraph, absolutePath: string): boolean {
  return isAppRouterFile(relativePath) && !graph.reachable.has(absolutePath)
}
