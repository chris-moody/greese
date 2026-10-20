/**
 * Fails when a component exported from @greese/react has no page of its
 * own: every PascalCase export must be some story meta's `component`, so it
 * gets a docs page with its props table and Styling section. Being listed in
 * a parent's `subcomponents` (AccordionItem under Accordion) isn't enough;
 * parents keep listing them for the props tabs.
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
    // SCREAMING_CASE exports are constants (TEXT_ROTATE_MAX), not components.
    if (!/^[A-Z0-9_]+$/.test(name)) exported.set(name, file)
  }
}

const storyFiles = readdirSync(storiesDir, { recursive: true }).filter((f) =>
  f.endsWith('.stories.tsx')
)
const documented = new Set()
for (const file of storyFiles) {
  const source = readFileSync(join(storiesDir, file), 'utf8')
  for (const [, name] of source.matchAll(/\bcomponent: (\w+)\b/g)) documented.add(name)
}

const missing = [...exported].filter(([name]) => !documented.has(name))
if (missing.length) {
  console.error(
    'Components without a page of their own (add a story file whose meta `component` is it):'
  )
  for (const [name, file] of missing)
    console.error(`  ${name}  (${relative(process.cwd(), join(componentsDir, file))})`)
  process.exit(1)
}
console.log(`Story coverage: all ${exported.size} exported components have a page.`)
