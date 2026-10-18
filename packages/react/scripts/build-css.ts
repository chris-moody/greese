#!/usr/bin/env node
/**
 * Builds every stylesheet @sauce-ui/react ships:
 *
 *   dist/sauce-ui.css     everything (tokens + all components)
 *   dist/base.css         opt-in reset and page defaults
 *   dist/css/core.css     layer order + tokens: what every component needs
 *   dist/css/<Name>.css   one component, @importing core and the components
 *                         it builds on, so bundlers pull in (and de-duplicate)
 *                         exactly what is used
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile, compileString, NodePackageImporter } from 'sass-embedded'
import { dependenciesOf, readComponents } from './cssGraph.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')
const importers = [new NodePackageImporter()]
const sass = (file: string) => compile(file, { importers }).css

mkdirSync(DIST, { recursive: true })
writeFileSync(join(DIST, 'sauce-ui.css'), sass(join(SRC, 'styles/index.scss')))
writeFileSync(join(DIST, 'base.css'), sass(join(SRC, 'styles/base.scss')))

const CSS = join(DIST, 'css')
rmSync(CSS, { recursive: true, force: true })
mkdirSync(CSS)
writeFileSync(
  join(CSS, 'core.css'),
  compileString(`@use 'pkg:@sauce-ui/tokens/scss';`, {
    importers,
    url: new URL(`file://${SRC}/`),
  }).css
)

const components = readComponents(join(SRC, 'components'))
const compiled = new Map(
  components
    .filter((c) => c.hasScss)
    .map(
      (c) => [c.name, sass(join(SRC, 'components', c.name, `${c.name}.scss`))] as const
    )
)
const { deps, unresolved } = dependenciesOf(components, compiled)
if (unresolved.length) {
  throw new Error(
    'Classes with no stylesheet:\n' +
      unresolved.map(({ component, cls }) => `  ${component}: ${cls}`).join('\n')
  )
}

let written = 0
for (const { name } of components) {
  const own = compiled.get(name) ?? ''
  const needs = deps.get(name) ?? []
  if (!own && !needs.length) continue // e.g. Slot: nothing to style
  const imports = ['core', ...needs].map((dep) => `@import './${dep}.css';`).join('\n')
  writeFileSync(join(CSS, `${name}.css`), `${imports}\n${own}\n`)
  written++
}
console.log(
  `wrote dist/sauce-ui.css, dist/base.css, dist/css/core.css and ${written} component stylesheets`
)
