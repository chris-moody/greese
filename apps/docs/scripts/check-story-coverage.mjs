/**
 * Fails when a component exported from @sauce-ui/react has no story: every
 * PascalCase export must be a story meta's `component` or one of its
 * `subcomponents`, so it gets a docs page and a props table.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const componentsDir = join(here, '../../../packages/react/src/components')
const storiesDir = join(here, '../stories')

const barrel = readFileSync(join(componentsDir, 'index.ts'), 'utf8')
const exported = new Map()
for (const [, file] of barrel.matchAll(/export \* from '\.\/(.+)'/g)) {
  const source = readFileSync(join(componentsDir, file), 'utf8')
  for (const [, name] of source.matchAll(/^export (?:const|function) ([A-Z]\w*)/gm)) {
    exported.set(name, file)
  }
}

const storyFiles = readdirSync(storiesDir, { recursive: true }).filter((f) =>
  f.endsWith('.stories.tsx')
)
const documented = new Set()
for (const file of storyFiles) {
  const source = readFileSync(join(storiesDir, file), 'utf8')
  for (const [, name] of source.matchAll(/\bcomponent: (\w+)\b/g)) documented.add(name)
  for (const [, list] of source.matchAll(/\bsubcomponents: \{([^}]*)\}/g)) {
    for (const name of list.split(',').map((s) => s.trim().split(':')[0].trim())) {
      if (name) documented.add(name)
    }
  }
}

const missing = [...exported].filter(([name]) => !documented.has(name))
if (missing.length) {
  console.error(
    'Components without a story (add a meta `component` or `subcomponents` entry):'
  )
  for (const [name, file] of missing)
    console.error(`  ${name}  (${relative(process.cwd(), join(componentsDir, file))})`)
  process.exit(1)
}
console.log(`Story coverage: all ${exported.size} exported components have a story.`)
