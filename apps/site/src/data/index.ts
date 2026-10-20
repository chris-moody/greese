/**
 * Everything the site quotes, derived from the generated JSON (see
 * scripts/stats.ts and apps/playground/bench/run.ts). Sections read these
 * helpers and never hard-code a number.
 */
import bench from './bench.json'
import stats from './stats.json'

export interface Measurement {
  name: string
  size: number
  sizeLimit: number
}

export interface Row {
  label: string
  size: number
  limit: number
}

/**
 * size-limit's kilobytes are 1000 bytes. Under 10 kB, two decimals, so a
 * 2,250 B budget reads 2.25 kB rather than rounding up to 2.3.
 */
export const kB = (bytes: number): string => {
  if (bytes < 1000) return `${bytes} B`
  const value = (bytes / 1000).toFixed(bytes < 10_000 ? 2 : 1)
  return `${value.replace(/\.?0+$/, '')} kB`
}

const find = (list: Measurement[], name: string): Measurement => {
  const m = list.find((x) => x.name === name)
  if (!m) throw new Error(`stats.json has no measurement named "${name}"`)
  return m
}

/**
 * `JS: tree-shaken { Tabs, TabList, Tab }` → `Tabs` (its parts are implied),
 * `{ ThemeProvider, createTheme }` → `ThemeProvider + createTheme` (a
 * function is a separate import); other names lose only their prefix.
 */
const label = (name: string): string => {
  const list = /\{ ([^}]+) \}/.exec(name)?.[1]?.split(', ')
  if (!list) return name.replace(/^(JS|CSS): /, '')
  const [first, ...rest] = list
  return [first, ...rest.filter((n) => /^[a-z]/.test(n))].join(' + ')
}

const rows = (list: Measurement[]): Row[] =>
  list.map((m) => ({ label: label(m.name), size: m.size, limit: m.sizeLimit }))

export const facts = {
  date: stats.date,
  components: stats.components,
  /** Runtime dependencies outside the project's own packages. */
  thirdPartyDependencies: stats.dependencies.filter((d) => !d.startsWith('@greese-ui/'))
    .length,
  library: find(stats.react, 'JS: whole library (components)'),
  libraryWithGreese: find(stats.react, 'JS: whole library, with greese.js'),
  button: find(stats.react, 'JS: tree-shaken { Button }'),
  css: find(stats.react, 'CSS: greese-ui.css'),
  greese: find(stats.greese, 'greese.js: everything'),
  runtime: find(stats.react, 'JS: greese prop runtime (lazy chunk, with greese.js)'),
}

export const sizeTables = {
  components: rows(
    stats.react.filter(
      (m) =>
        (m.name.startsWith('JS: tree-shaken') && !m.name.includes('useGreese')) ||
        !/^(JS|CSS):/.test(m.name)
    )
  ).sort((a, b) => a.size - b.size),
  motion: rows([
    ...stats.greese,
    ...stats.react.filter(
      (m) => /greese/.test(m.name) && !m.name.startsWith('JS: whole')
    ),
  ]),
  bundles: rows(stats.react.filter((m) => /^(CSS:|JS: whole)/.test(m.name))),
}

export interface Metric {
  label: string
  key: string
  unit: string
  /** GreeseUI with the whole stylesheet (`styles.css`). */
  greese: number
  /** GreeseUI with per-component CSS (`css/Stack.css`). */
  greeseCss: number
  mui: number
}

/** Which GreeseUI build a comparison uses. */
export type Setup = 'greese' | 'greeseCss'

export const benchmark = {
  runs: bench.runs,
  cpu: bench.cpu,
  stacks: bench.stacks,
  date: bench.date,
  // `<style> elements` is a count, not a speed: shown as prose, not a bar.
  metrics: bench.metrics.filter((m) => m.unit !== '') as Metric[],
  styleElements: bench.metrics.find((m) => m.key === 'styleElements')!,
}

/** How many times more MUI takes (higher is better for greese). */
export const ratio = (m: Metric, setup: Setup = 'greese'): number => m.mui / m[setup]

/** Within 5% either way counts as even: these are medians of noisy runs. */
export const outcome = (m: Metric, setup: Setup = 'greese'): 'win' | 'loss' | 'even' => {
  const r = ratio(m, setup)
  return r > 1.05 ? 'win' : r < 0.95 ? 'loss' : 'even'
}

/** Wins, ties and losses against MUI across the metrics. */
export const scorecard = (setup: Setup) => {
  const tally = { win: 0, even: 0, loss: 0 }
  for (const m of benchmark.metrics) tally[outcome(m, setup)]++
  return tally
}

/** Main-thread work on load: script, style and layout together. */
export const mainThread = (setup: Setup | 'mui'): number =>
  ['scriptMs', 'styleMs', 'layoutMs']
    .map((key) => benchmark.metrics.find((m) => m.key === key)![setup])
    .reduce((a, b) => a + b, 0)

export const metric = (label: string): Metric => {
  const m = benchmark.metrics.find((x) => x.label === label)
  if (!m) throw new Error(`bench.json has no metric "${label}"`)
  return m
}

export const fmt = (n: number, unit: string): string =>
  `${n >= 100 ? n.toFixed(0) : n.toFixed(1)}${unit ? ` ${unit}` : ''}`
