#!/usr/bin/env node
/**
 * Refreshes src/data/stats.json, the numbers the homepage quotes, from the
 * repository itself: size-limit's measurements (brotli) for both packages,
 * the exported component count, and the runtime dependencies.
 *
 *   npm run build            (at the root: size-limit measures dist/)
 *   npm run stats -w site
 *
 * The MUI comparison lives in src/data/bench.json, written by
 * `node bench/run.ts --json ../site/src/data/bench.json` in apps/playground.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const out = join(root, 'apps/site/src/data/stats.json')

interface Measurement {
  name: string
  size: number
  sizeLimit: number
}

const measure = (pkg: string): Measurement[] =>
  (
    JSON.parse(
      execFileSync('npx', ['size-limit', '--json'], {
        cwd: join(root, 'packages', pkg),
        encoding: 'utf8',
      })
    ) as Measurement[]
  ).map(({ name, size, sizeLimit }) => ({ name, size, sizeLimit }))

// Counted the way the docs' story-coverage check counts them.
const components = (() => {
  const dir = join(root, 'packages/react/src/components')
  const names = new Set<string>()
  const barrel = readFileSync(join(dir, 'index.ts'), 'utf8')
  for (const [, file] of barrel.matchAll(/export \* from '\.\/(.+)'/g)) {
    const source = readFileSync(join(dir, file!), 'utf8')
    for (const [, name] of source.matchAll(/^export (?:const|function) ([A-Z]\w*)/gm))
      names.add(name!)
  }
  return names.size
})()

const dependencies = Object.keys(
  (
    JSON.parse(readFileSync(join(root, 'packages/react/package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
    }
  ).dependencies ?? {}
)

const stats = {
  date: new Date().toISOString().slice(0, 10),
  components,
  dependencies,
  react: measure('react'),
  greese: measure('greese'),
}
writeFileSync(out, `${JSON.stringify(stats, null, 2)}\n`)
console.log(
  `wrote ${out}: ${components} components, ${stats.react.length + stats.greese.length} measurements`
)
