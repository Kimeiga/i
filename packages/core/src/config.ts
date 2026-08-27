import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ResolvedConfig, Severity } from './types.js'
import { SEVERITIES } from './types.js'
import { PRODUCT_SLUG } from './product.js'

export const CONFIG_FILENAME = `${PRODUCT_SLUG}.config.json`

export const DEFAULT_CONFIG: ResolvedConfig = {
  include: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/*.d.ts',
    // Test and story files intentionally contain broken markup. Scanning them
    // produces findings nobody will ever fix, which trains users to ignore us.
    '**/*.{test,spec}.{ts,tsx,js,jsx}',
    '**/*.stories.{ts,tsx,js,jsx}',
    '**/__tests__/**',
    '**/__mocks__/**',
  ],
  urls: [],
  disabledRules: [],
  enabledExperimental: [],
  failOn: 'serious',
  failOnNewOnly: false,
}

export interface UserConfig {
  include?: string[]
  exclude?: string[]
  urls?: string[]
  rules?: Record<string, 'off' | 'on'>
  failOn?: Severity | 'never'
  failOnNewOnly?: boolean
  buildDir?: string
  baselineReport?: string
}

export class ConfigError extends Error {}

export function resolveConfig(user: UserConfig | undefined, overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  const u = user ?? {}
  if (u.failOn !== undefined && u.failOn !== 'never' && !SEVERITIES.includes(u.failOn)) {
    throw new ConfigError(
      `failOn must be one of ${[...SEVERITIES, 'never'].join(', ')} (got ${JSON.stringify(u.failOn)})`,
    )
  }

  const disabled: string[] = []
  const experimental: string[] = []
  for (const [id, state] of Object.entries(u.rules ?? {})) {
    if (state === 'off') disabled.push(id)
    else if (state === 'on') experimental.push(id)
    else throw new ConfigError(`rules["${id}"] must be "on" or "off" (got ${JSON.stringify(state)})`)
  }

  const base: ResolvedConfig = {
    include: u.include ?? DEFAULT_CONFIG.include,
    // User excludes extend the defaults rather than replacing them: replacing
    // them silently re-enables node_modules scanning, which is never wanted.
    exclude: u.exclude ? [...DEFAULT_CONFIG.exclude, ...u.exclude] : DEFAULT_CONFIG.exclude,
    urls: u.urls ?? DEFAULT_CONFIG.urls,
    disabledRules: disabled,
    enabledExperimental: experimental,
    failOn: u.failOn ?? DEFAULT_CONFIG.failOn,
    failOnNewOnly: u.failOnNewOnly ?? DEFAULT_CONFIG.failOnNewOnly,
    buildDir: u.buildDir,
    baselineReport: u.baselineReport,
  }

  return { ...base, ...stripUndefined(overrides) }
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>
}

export async function loadConfig(rootDir: string): Promise<UserConfig | undefined> {
  const path = join(rootDir, CONFIG_FILENAME)
  if (!existsSync(path)) return undefined
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (err) {
    throw new ConfigError(`Could not read ${CONFIG_FILENAME}: ${(err as Error).message}`)
  }
  try {
    return JSON.parse(raw) as UserConfig
  } catch (err) {
    throw new ConfigError(`${CONFIG_FILENAME} is not valid JSON: ${(err as Error).message}`)
  }
}

export function isRuleEnabled(
  ruleId: string,
  experimental: boolean | undefined,
  config: ResolvedConfig,
): { enabled: true } | { enabled: false; reason: string } {
  const packPrefix = `${ruleId.split('/')[0]}/`
  if (config.disabledRules.includes(ruleId)) {
    return { enabled: false, reason: 'disabled in config' }
  }
  if (config.disabledRules.includes(packPrefix) || config.disabledRules.includes(packPrefix.slice(0, -1))) {
    return { enabled: false, reason: 'rule group disabled in config' }
  }
  if (experimental && !config.enabledExperimental.includes(ruleId)) {
    return {
      enabled: false,
      reason: 'experimental; enable explicitly with { "rules": { "' + ruleId + '": "on" } }',
    }
  }
  return { enabled: true }
}
