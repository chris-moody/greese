#!/usr/bin/env node
/**
 * Proves the packages work as published: packs @greese/ui,
 * @greese/js (greese.js), @greese/react, @greese/icons and @greese/svg, installs the tarballs into an empty project, and checks
 * what a consumer would do with them.
 *
 *   npm run build && npm run verify:packages
 */
import { execFileSync } from 'node:child_process'
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'pipe' })
const root = join(import.meta.dirname, '..')
const work = mkdtempSync(join(process.env.VERIFY_TMP ?? tmpdir(), 'greese-verify-'))
const ok = (label) => console.log(`  ✔ ${label}`)

try {
  // 1. Pack and install, the way npm would publish them.
  run(
    'npm',
    [
      'pack',
      '-w',
      '@greese/ui',
      '-w',
      '@greese/js',
      '-w',
      '@greese/react',
      '-w',
      '@greese/icons',
      '-w',
      '@greese/svg',
      '--pack-destination',
      work,
    ],
    root
  )
  const tarballs = readdirSync(work).filter((f) => f.endsWith('.tgz'))
  writeFileSync(
    join(work, 'package.json'),
    JSON.stringify({
      name: 'consumer',
      private: true,
      type: 'module',
      dependencies: Object.fromEntries(
        tarballs.map((t) => [
          `@greese/${/^greese-(ui|js|react|icons|svg)-\d/.exec(t)[1]}`,
          `file:./${t}`,
        ])
      ),
    })
  )
  run(
    'npm',
    [
      'install',
      '--no-audit',
      '--no-fund',
      'react@19',
      'react-dom@19',
      '@types/react@19',
      'typescript@~6.0.3',
      'sass-embedded',
      'vite@8',
    ],
    work
  )
  ok(`installed ${tarballs.join(', ')}`)

  // 2. Plain Node ESM (what an SSR server does): import and render.
  writeFileSync(
    join(work, 'ssr.mjs'),
    `import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { Button, Card, Stack, createTheme, timeline } from '@greese/react'
// The greese prop's opt-in runtime imports cleanly on a server.
import '@greese/react/greese'
import { breakpoints } from '@greese/ui'
import { animate } from '@greese/js'
// greese.js imports and runs without a DOM: plain objects animate on a server.
const o = { v: 0 }
timeline({ paused: true }).to(o, { v: 10, duration: 1, ease: 'linear' }).seek(0.5)
if (o.v !== 5 || typeof animate !== 'function') throw new Error('greese.js')
// greese prop CSS presets render on the server with no client code.
const card = renderToString(createElement(Card, { greese: { enter: 'fadeUp', delay: 0.1 } }, 'x'))
if (!card.includes('greese-Motion--enter-fade-up') || !card.includes('--greese-motion-delay:0.1s')) throw new Error(card)
const html = renderToString(createElement(Stack, { gap: 2, direction: { md: 'row' } }, createElement(Button, null, 'Hi')))
if (!html.includes('greese-Stack--md-direction-row') || !html.includes('greese-Button')) throw new Error(html)
if (breakpoints.md !== 900 || !createTheme({ name: 'x' }).css.includes('@layer greese.theme')) throw new Error('tokens')
`
  )
  run('node', ['ssr.mjs'], work)
  ok(
    'Node ESM import + server render; greese.js runs without a DOM; greese prop presets render on the server'
  )

  // The <script> build: one file that defines window.greese.
  writeFileSync(
    join(work, 'global.cjs'),
    `const vm = require('node:vm'), fs = require('node:fs')
const ctx = {}
vm.createContext(ctx)
vm.runInContext(fs.readFileSync(require.resolve('@greese/js/global'), 'utf8'), ctx)
const o = { v: 0 }
ctx.greese.timeline({ paused: true }).to(o, { v: 10, duration: 1, ease: 'linear' }).seek(0.5)
if (o.v !== 5 || typeof ctx.greese.fromPixels !== 'function') throw new Error('global build')
`
  )
  run('node', ['global.cjs'], work)
  ok('greese.js <script> build defines a working window.greese')

  // 3. Types, under both module resolutions consumers use.
  writeFileSync(
    join(work, 'app.tsx'),
    `import { Button, Dialog, type Responsive } from '@greese/react'
import type { Breakpoint } from '@greese/ui'
const bp: Breakpoint = 'md'
const dir: Responsive<'row' | 'column'> = { xs: 'column', [bp]: 'row' }
export const App = () => <Dialog title="T" trigger={<Button>{String(dir)}</Button>} />
`
  )
  for (const [module, resolution] of [
    ['esnext', 'bundler'],
    ['nodenext', 'nodenext'],
  ]) {
    writeFileSync(
      join(work, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          jsx: 'react-jsx',
          module,
          moduleResolution: resolution,
          noEmit: true,
          skipLibCheck: false,
          types: [],
        },
        files: ['app.tsx'],
      })
    )
    run('npx', ['tsc', '-p', '.'], work)
  }
  ok('types resolve (bundler and nodenext, skipLibCheck off)')

  // 4. Custom breakpoints from the published SCSS.
  writeFileSync(
    join(work, 'custom.mjs'),
    `import { compileString, NodePackageImporter } from 'sass-embedded'
const { css } = compileString("@use 'pkg:@greese/ui/scss' with ($breakpoints: (xs: 0px, sm: 480px, tablet: 700px, md: 768px, lg: 1024px, xl: 1440px));", { importers: [new NodePackageImporter()], url: new URL(import.meta.url) })
if (!css.includes('(width >= 768px)') || css.includes('(width >= 900px)')) throw new Error('breakpoints not applied')
if (!css.includes('--greese-breakpoint-tablet: 700px') || !css.includes('.greese-Stack--tablet-gap-3')) throw new Error('added breakpoint key not applied')
`
  )
  run('node', ['custom.mjs'], work)
  ok('pkg:@greese/ui/scss recompiles with custom breakpoints and an added key')

  // 4b. The SCSS kit and the style manifest, as published.
  writeFileSync(
    join(work, 'kit.mjs'),
    `import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { compileString, NodePackageImporter } from 'sass-embedded'
const compile = (scss) => compileString("@use 'pkg:@greese/ui/scss/kit' as greese;\\n" + scss, { importers: [new NodePackageImporter()], url: new URL(import.meta.url) }).css
const css = compile('@include greese.component(Button) { @include greese.part(icon) { opacity: 0.5; } }')
if (!css.includes('.greese-Button .greese-Button-icon') || !css.includes('greese.overrides, greese.utilities;')) throw new Error('kit output wrong: ' + css)
let failed = false
try { compile('@include greese.component(Buton) {}') } catch { failed = true }
if (!failed) throw new Error('kit accepted an unknown component')
const manifest = JSON.parse(readFileSync(createRequire(import.meta.url).resolve('@greese/ui/style-manifest.json'), 'utf8'))
if (!manifest.blocks.Button?.variables.includes('--greese-button-tone')) throw new Error('style manifest incomplete')
// The partials theme authors @use (ADR 0021): published, and the same modules the kit configures.
const authored = compileString("@use 'pkg:@greese/ui/scss/config' with ($breakpoints: (xs: 0px, sm: 500px, md: 700px, lg: 1000px, xl: 1400px));\\n@use 'pkg:@greese/ui/scss/kit' as greese;\\n@use 'pkg:@greese/ui/scss/mixins';\\n@use 'pkg:@greese/ui/scss/tones';\\n@use 'pkg:@greese/ui/scss/floating';\\n@use 'pkg:@greese/ui/scss/controls';\\n@include greese.component(Card) { @include mixins.up(md) { gap: 1px; } @include floating.surface; }", { importers: [new NodePackageImporter()], url: new URL(import.meta.url) }).css
if (!authored.includes('@media (width >= 700px)') || !authored.includes('.greese-Card')) throw new Error('authoring entry points wrong: ' + authored)
`
  )
  run('node', ['kit.mjs'], work)
  ok(
    'pkg:@greese/ui/scss/kit compiles and checks names; the authoring partials resolve; style-manifest.json resolves'
  )

  // 4c. The icons render on the server, and the library depends on them (it
  // draws its own glyphs with them: ADR 0020).
  writeFileSync(
    join(work, 'icons.mjs'),
    `import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { SearchIcon, createIcon } from '@greese/icons'
const html = renderToString(createElement(SearchIcon, { title: 'Search' }))
if (!html.includes('role="img"') || !html.includes('<title>Search</title>')) throw new Error('icon html: ' + html)
if (createIcon('Kite', 'M0 0').displayName !== 'KiteIcon') throw new Error('createIcon')
const react = JSON.parse(readFileSync('node_modules/@greese/react/package.json', 'utf8'))
if (!react.dependencies?.['@greese/icons']) throw new Error('@greese/react must depend on the icons')
`
  )
  run('node', ['icons.mjs'], work)
  ok('@greese/icons renders on the server, and @greese/react depends on it')

  // 4d. @greese/svg's geometry runs in Node with no DOM, and @greese/react/svg
  // renders on the server from the published entry point (ADR 0031).
  writeFileSync(
    join(work, 'svg.mjs'),
    `import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { dashes, matchPaths, pathLength, toPath } from '@greese/svg'
import { Drawing, Path, Morph, LinearGradient } from '@greese/react/svg'
if (Math.round(pathLength('M0 0H10V10')) !== 20) throw new Error('pathLength')
const [a, b] = matchPaths({ type: 'star', r: 10 }, { type: 'circle', r: 10 })
if (a.replace(/[\\d.-]+/g, '#') !== b.replace(/[\\d.-]+/g, '#')) throw new Error('matchPaths')
if (dashes({ start: 10, end: 30 }).strokeDasharray !== '20 101') throw new Error('dashes')
const html = renderToString(createElement(Drawing, { label: 'Art' },
  createElement(LinearGradient, { id: 'g', stops: ['red', 'blue'] }),
  createElement(Path, { d: { type: 'circle', r: 5 }, slice: { end: 50 } }),
  createElement(Morph, { shapes: ['M0 0H1', 'M0 0H2'], progress: 0.5 })))
if (!html.includes('role="img"') || !html.includes('stop-color="red"') || !html.includes('pathLength="100"') || !html.includes(toPath({ type: 'circle', r: 5 }))) throw new Error('svg html: ' + html)
`
  )
  run('node', ['svg.mjs'], work)
  ok('@greese/svg runs without a DOM; @greese/react/svg renders on the server')

  // 5. Every per-component @import points at a shipped file: React's
  // stylesheets import @greese/ui's, which import core.
  const uiCss = join(work, 'node_modules/@greese/ui/dist/css')
  const cssDir = join(work, 'node_modules/@greese/react/dist/css')
  for (const [dir, pattern, base] of [
    [cssDir, /@import '@greese\/ui\/css\/([\w-]+\.css)'/g, uiCss],
    [uiCss, /@import '\.\/([\w-]+\.css)'/g, uiCss],
  ]) {
    for (const file of readdirSync(dir)) {
      for (const [, target] of readFileSync(join(dir, file), 'utf8').matchAll(pattern)) {
        if (!existsSync(join(base, target)))
          throw new Error(`${file} imports missing ${target}`)
      }
    }
  }
  ok(
    `${readdirSync(cssDir).length} React and ${readdirSync(uiCss).length} @greese/ui stylesheets, all imports resolve`
  )

  // 5b. @greese/ui is framework-free: it needs no other package, and plain
  // HTML can use its stylesheet.
  const ui = JSON.parse(
    readFileSync(join(work, 'node_modules/@greese/ui/package.json'), 'utf8')
  )
  if (ui.dependencies || ui.peerDependencies)
    throw new Error('@greese/ui must not depend on any package')
  const react = JSON.parse(
    readFileSync(join(work, 'node_modules/@greese/react/package.json'), 'utf8')
  )
  if (!react.dependencies?.['@greese/ui'] || !react.dependencies?.['@greese/js'])
    throw new Error('@greese/react must depend on @greese/ui and @greese/js')
  if (
    !readFileSync(join(work, 'node_modules/@greese/ui/dist/greese.css'), 'utf8').includes(
      '.greese-Button'
    )
  )
    throw new Error('greese.css has no Button styles')
  ok(
    '@greese/ui needs no other package; @greese/react depends on @greese/ui and @greese/js'
  )

  // 6. A bundler follows (and de-duplicates) the per-component import chain.
  writeFileSync(
    join(work, 'index.html'),
    '<script type="module" src="/main.js"></script>'
  )
  writeFileSync(
    join(work, 'main.js'),
    `import '@greese/react/css/Dialog.css'\nimport '@greese/react/css/Button.css'\nimport '@greese/ui/css/Button.css'\n`
  )
  run('npx', ['vite', 'build', '--logLevel', 'error'], work)
  const assets = join(work, 'dist/assets')
  const css = readdirSync(assets)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(assets, f), 'utf8'))
    .join('')
  const count = (selector) => css.split(selector).length - 1
  if (!count('.greese-Dialog{') || !count('--greese-color-canvas'))
    throw new Error('Dialog chain not bundled')
  if (count('.greese-Button{') !== 1)
    throw new Error(`Button styles bundled ${count('.greese-Button{')} times`)
  if (count('.greese-Stack')) throw new Error('unrelated component styles were bundled')
  ok(
    `Vite bundles css/Dialog.css + css/Button.css: ${(css.length / 1024).toFixed(1)} kB, shared styles once, nothing unused`
  )

  // 7. The greese prop's runtime and greese.js are a lazy chunk: an app that
  // renders a Button with no greese prop never loads them.
  rmSync(join(work, 'dist'), { recursive: true, force: true })
  writeFileSync(
    join(work, 'main.js'),
    `import { createElement } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport { Button } from '@greese/react'\ncreateRoot(document.body).render(createElement(Button, null, 'Hi'))\n`
  )
  run('npx', ['vite', 'build', '--logLevel', 'error'], work)
  const html = readFileSync(join(work, 'dist/index.html'), 'utf8')
  const entry = /src="\/assets\/([^"]+\.js)"/.exec(html)[1]
  const js = readdirSync(assets).filter((f) => f.endsWith('.js'))
  const entryCode = readFileSync(join(assets, entry), 'utf8')
  const lazy = js.filter(
    (f) => f !== entry && readFileSync(join(assets, f), 'utf8').includes('unknown ease')
  )
  if (entryCode.includes('unknown ease'))
    throw new Error('greese.js is in the entry chunk')
  if (lazy.length !== 1)
    throw new Error(`expected one lazy greese chunk, found ${lazy.length}`)
  ok(
    'Vite splits the greese runtime + greese.js into a lazy chunk: a plain Button never loads it'
  )
} finally {
  if (!process.env.KEEP) rmSync(work, { recursive: true, force: true })
}
console.log('Packages verified.')
