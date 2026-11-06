#!/usr/bin/env node
/**
 * Builds @greese/react's stylesheets and style data from @greese/ui's.
 *
 * The CSS itself is @greese/ui's, framework-free. What a React component
 * needs besides its own CSS (a Dialog renders a Button) is known only from
 * its TSX, so it's worked out here, and each component gets a stylesheet
 * that imports exactly what it uses:
 *
 *   dist/styles.css       @greese/ui's whole stylesheet
 *   dist/base.css         @greese/ui's opt-in reset
 *   dist/css/core.css     layer order + tokens
 *   dist/css/resets.css   @greese/ui's opt-in reset classes (theme layers)
 *   dist/css/<Name>.css   @imports core, the components it builds on, and
 *                         its own, so bundlers pull in (and de-duplicate)
 *                         exactly what is used
 *   dist/component-styles.json   which style blocks each component renders
 *
 * These are one-line @imports, so an app that installs only @greese/react
 * can still `import '@greese/react/styles.css'`, and under strict package
 * managers the import resolves from this package, which depends on
 * @greese/ui.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { componentUses } from './componentStyles.ts'
import { dependenciesOf, readComponents } from './cssGraph.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')
const UI = dirname(fileURLToPath(import.meta.resolve('@greese/ui/package.json')))
const UI_CSS = join(UI, 'dist/css')

const imports = (...specs: string[]) => specs.map((s) => `@import '${s}';`).join('\n')

rmSync(DIST + '/css', { recursive: true, force: true })
mkdirSync(join(DIST, 'css'), { recursive: true })
writeFileSync(join(DIST, 'styles.css'), `${imports('@greese/ui/styles.css')}\n`)
writeFileSync(join(DIST, 'base.css'), `${imports('@greese/ui/base.css')}\n`)
writeFileSync(join(DIST, 'css/core.css'), `${imports('@greese/ui/css/core.css')}\n`)
writeFileSync(join(DIST, 'css/resets.css'), `${imports('@greese/ui/css/resets.css')}\n`)

// Each @greese/ui stylesheet holds one component's own CSS (plus core, and
// the opt-in resets, which no component needs).
const compiled = new Map(
  readdirSync(UI_CSS)
    .filter((file) => file.endsWith('.css') && !['core.css', 'resets.css'].includes(file))
    .map((file) => [file.slice(0, -4), readFileSync(join(UI_CSS, file), 'utf8')] as const)
)

const components = readComponents(join(SRC, 'components'), new Set(compiled.keys()))
const { deps, unresolved } = dependenciesOf(components, compiled)
if (unresolved.length) {
  throw new Error(
    'Classes with no stylesheet in @greese/ui:\n' +
      unresolved.map(({ component, cls }) => `  ${component}: ${cls}`).join('\n')
  )
}

let written = 0
for (const { name } of components) {
  const own = compiled.has(name)
  const needs = deps.get(name) ?? []
  if (!own && !needs.length) continue // e.g. Slot: nothing to style
  writeFileSync(
    join(DIST, 'css', `${name}.css`),
    `${imports(
      '@greese/ui/css/core.css',
      // A component with no CSS of its own (MaskedInput, built on Input) has
      // a stylesheet here that imports what it uses.
      ...needs.map((n) => (compiled.has(n) ? `@greese/ui/css/${n}.css` : `./${n}.css`)),
      ...(own ? [`@greese/ui/css/${name}.css`] : [])
    )}\n`
  )
  written++
}

const manifest = JSON.parse(
  readFileSync(join(UI, 'dist/style-manifest.json'), 'utf8')
) as {
  blocks: Record<string, unknown>
}
const sources = new Map(
  components.flatMap(({ name }) => {
    const dir = join(SRC, 'components', name)
    return readdirSync(dir)
      .filter((file) => /\.tsx?$/.test(file) && !/\.test\./.test(file))
      .map((file): [string, string] => [file, readFileSync(join(dir, file), 'utf8')])
  })
)
writeFileSync(
  join(DIST, 'component-styles.json'),
  `${JSON.stringify({ version: 1, components: componentUses(sources, new Set(Object.keys(manifest.blocks))) }, null, 2)}\n`
)
console.log(
  `wrote dist/styles.css, dist/base.css, dist/css/core.css, dist/component-styles.json and ${written} component stylesheets`
)
