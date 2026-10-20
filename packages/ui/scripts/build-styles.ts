#!/usr/bin/env node
/**
 * Builds every stylesheet @greese/ui ships from the component SCSS, after
 * build-tokens.ts (the styles read the token modules it writes to dist/):
 *
 *   dist/greese.css       everything (tokens + all components)
 *   dist/base.css         opt-in reset and page defaults
 *   dist/css/core.css     layer order + tokens: what every component needs
 *   dist/css/<Name>.css   one component's own styles, @importing core
 *   dist/style-manifest.json   each component's styling API (styleManifest.ts)
 *
 * and refreshes src/styles/_manifest.scss, the kit's name list.
 *
 * What a component needs besides its own CSS (a Dialog renders a Button) is
 * known to the framework that renders it, so each framework package builds
 * its per-component stylesheets from these (@greese/react does).
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'sass-embedded'
import { manifestScss, styleManifest } from './styleManifest.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')
const sass = (file: string) => compile(file).css

mkdirSync(DIST, { recursive: true })
writeFileSync(join(DIST, 'greese.css'), sass(join(SRC, 'styles/index.scss')))
writeFileSync(join(DIST, 'base.css'), sass(join(SRC, 'styles/base.scss')))

const CSS = join(DIST, 'css')
rmSync(CSS, { recursive: true, force: true })
mkdirSync(CSS)
const core = sass(join(SRC, 'styles/_core.scss'))
writeFileSync(join(CSS, 'core.css'), core)

const names = readdirSync(join(SRC, 'components'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
const compiled = new Map(
  names.map((name) => [name, sass(join(SRC, 'components', name, `${name}.scss`))] as const)
)
// styles/index.scss lists components by hand (cascade order matters); one
// left out would ship per-component CSS but be missing from greese.css.
const bundle = readFileSync(join(SRC, 'styles/index.scss'), 'utf8')
const unbundled = names.filter((name) => !bundle.includes(`'../components/${name}/${name}'`))
if (unbundled.length) {
  throw new Error(`Stylesheets missing from styles/index.scss: ${unbundled.join(', ')}`)
}

const tokensCss = readFileSync(join(DIST, 'tokens.css'), 'utf8')
const tokenVars = new Set(tokensCss.match(/--greese-[a-z0-9-]+(?=:)/g))
const manifest = styleManifest(compiled, tokenVars)
writeFileSync(join(DIST, 'style-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
const manifestFile = join(SRC, 'styles/_manifest.scss')
const scss = manifestScss(manifest)
if (readFileSync(manifestFile, { encoding: 'utf8', flag: 'a+' }) !== scss)
  writeFileSync(manifestFile, scss)

for (const [name, css] of compiled) writeFileSync(join(CSS, `${name}.css`), `@import './core.css';\n${css}\n`)
console.log(
  `wrote dist/greese.css, dist/base.css, dist/css/core.css, dist/style-manifest.json and ${compiled.size} component stylesheets`
)
