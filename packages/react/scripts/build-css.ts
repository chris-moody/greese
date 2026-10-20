#!/usr/bin/env node
/**
 * Builds every stylesheet @greese/react ships:
 *
 *   dist/greese-ui.css     everything (tokens + all components)
 *   dist/base.css         opt-in reset and page defaults
 *   dist/css/core.css     layer order + tokens: what every component needs
 *   dist/css/<Name>.css   one component, @importing core and the components
 *                         it builds on, so bundlers pull in (and de-duplicate)
 *                         exactly what is used
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile, compileString, NodePackageImporter } from 'sass-embedded'
import { dependenciesOf, readComponents } from './cssGraph.ts'
import { manifestScss, styleManifest } from './styleManifest.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')
const importers = [new NodePackageImporter()]
const sass = (file: string) => compile(file, { importers }).css

mkdirSync(DIST, { recursive: true })
writeFileSync(join(DIST, 'greese-ui.css'), sass(join(SRC, 'styles/index.scss')))
writeFileSync(join(DIST, 'base.css'), sass(join(SRC, 'styles/base.scss')))

const CSS = join(DIST, 'css')
rmSync(CSS, { recursive: true, force: true })
mkdirSync(CSS)
writeFileSync(
  join(CSS, 'core.css'),
  compileString(`@use 'pkg:@greese/ui/scss';`, {
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
// styles/index.scss lists components by hand (cascade order matters); one
// left out would ship per-component CSS but be missing from greese-ui.css.
const bundle = readFileSync(join(SRC, 'styles/index.scss'), 'utf8')
const unbundled = [...compiled.keys()].filter(
  (name) => !bundle.includes(`'../components/${name}/${name}'`)
)
if (unbundled.length) {
  throw new Error(`Stylesheets missing from styles/index.scss: ${unbundled.join(', ')}`)
}

const { deps, unresolved } = dependenciesOf(components, compiled)
if (unresolved.length) {
  throw new Error(
    'Classes with no stylesheet:\n' +
      unresolved.map(({ component, cls }) => `  ${component}: ${cls}`).join('\n')
  )
}

const tokensCss = readFileSync(
  fileURLToPath(import.meta.resolve('@greese/ui/tokens.css')),
  'utf8'
)
const tokenVars = new Set(tokensCss.match(/--greese-[a-z0-9-]+(?=:)/g))
const sources = new Map(
  components.flatMap(({ name }) => {
    const dir = join(SRC, 'components', name)
    return readdirSync(dir)
      .filter((file) => /\.tsx?$/.test(file) && !/\.test\./.test(file))
      .map((file): [string, string] => [file, readFileSync(join(dir, file), 'utf8')])
  })
)
const manifest = styleManifest(compiled, tokenVars, sources)
writeFileSync(join(DIST, 'style-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
const manifestFile = join(SRC, 'styles/_manifest.scss')
const scss = manifestScss(manifest)
if (readFileSync(manifestFile, { encoding: 'utf8', flag: 'a+' }) !== scss)
  writeFileSync(manifestFile, scss)

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
  `wrote dist/greese-ui.css, dist/base.css, dist/css/core.css, dist/style-manifest.json and ${written} component stylesheets`
)
