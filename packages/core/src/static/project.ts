import { Project, type SourceFile } from 'ts-morph'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import type { ScanInput } from '../types.js'

/**
 * Shared TypeScript project construction.
 *
 * Building the ts-morph project is by far the most expensive step in a scan, so
 * it happens once per scan and both rule packs reuse it through
 * `ScanInput.shared`. The key is namespaced to avoid collisions with anything a
 * third-party pack might stash there.
 */
const PROJECT_KEY = 'attestci/core:ts-project'

export interface StaticProject {
  project: Project
  /** Only the files the config selected, in scan order. */
  sourceFiles: SourceFile[]
  rootDir: string
  /** Repo-relative POSIX path for a source file. */
  relative(file: SourceFile): string
}

export async function getStaticProject(input: ScanInput): Promise<StaticProject> {
  const cached = input.shared.get(PROJECT_KEY) as StaticProject | undefined
  if (cached) return cached

  const built = buildProject(input.rootDir, input.files)
  input.shared.set(PROJECT_KEY, built)
  return built
}

export function buildProject(rootDir: string, files: readonly string[]): StaticProject {
  const tsconfig = ['tsconfig.json', 'jsconfig.json']
    .map((name) => join(rootDir, name))
    .find((p) => existsSync(p))

  const project = new Project({
    // We add files explicitly from the scan's own discovery, so the tsconfig is
    // read for compiler options and path aliases only. Letting it pull in its
    // own file list would scan files the user excluded.
    tsConfigFilePath: tsconfig,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: false,
    compilerOptions: {
      allowJs: true,
      checkJs: false,
      jsx: 4 /* ts.JsxEmit.ReactJSX */,
      // A repo we are scanning may not compile. That is not our problem: we are
      // reading its syntax, not type-checking it, and refusing to run because
      // someone else's build is red would make us useless in exactly the
      // situation where we are most needed.
      noEmit: true,
    },
  })

  const sourceFiles: SourceFile[] = []
  for (const relativePath of files) {
    try {
      sourceFiles.push(project.addSourceFileAtPath(join(rootDir, relativePath)))
    } catch {
      // Unreadable or unparseable file: skip it. Recorded nowhere, because a
      // file that cannot be parsed is usually generated or not really source.
    }
  }

  const built: StaticProject = {
    project,
    sourceFiles,
    rootDir,
    relative: (file) => toRelative(rootDir, file.getFilePath()),
  }
  return built
}

export function toRelative(rootDir: string, absolutePath: string): string {
  const normalizedRoot = rootDir.replace(/\\/g, '/').replace(/\/$/, '')
  const normalized = absolutePath.replace(/\\/g, '/')
  return normalized.startsWith(`${normalizedRoot}/`)
    ? normalized.slice(normalizedRoot.length + 1)
    : normalized
}
