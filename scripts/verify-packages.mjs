#!/usr/bin/env node
/**
 * Proves the packages work as published: packs @greese-ui/tokens,
 * @greese-ui/greese (greese.js) and @greese-ui/react, installs the tarballs into an empty project, and checks
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
      '@greese-ui/tokens',
      '-w',
      '@greese-ui/greese',
      '-w',
      '@greese-ui/react',
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
          `@greese-ui/${/^greese-ui-(tokens|greese|react)-/.exec(t)[1]}`,
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
import { Button, Stack, createTheme, timeline } from '@greese-ui/react'
import { breakpoints } from '@greese-ui/tokens'
import { animate } from '@greese-ui/greese'
// greese.js imports and runs without a DOM: plain objects animate on a server.
const o = { v: 0 }
timeline({ paused: true }).to(o, { v: 10, duration: 1, ease: 'linear' }).seek(0.5)
if (o.v !== 5 || typeof animate !== 'function') throw new Error('greese.js')
const html = renderToString(createElement(Stack, { gap: 2, direction: { md: 'row' } }, createElement(Button, null, 'Hi')))
if (!html.includes('greese-Stack--md-direction-row') || !html.includes('greese-Button')) throw new Error(html)
if (breakpoints.md !== 900 || !createTheme({ name: 'x' }).css.includes('@layer greese.theme')) throw new Error('tokens')
`
  )
  run('node', ['ssr.mjs'], work)
  ok('Node ESM import + server render; greese.js runs without a DOM')

  // 3. Types, under both module resolutions consumers use.
  writeFileSync(
    join(work, 'app.tsx'),
    `import { Button, Dialog, type Responsive } from '@greese-ui/react'
import type { Breakpoint } from '@greese-ui/tokens'
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
const { css } = compileString("@use 'pkg:@greese-ui/react/scss' with ($breakpoints: (xs: 0px, sm: 480px, md: 768px, lg: 1024px, xl: 1440px));", { importers: [new NodePackageImporter()], url: new URL(import.meta.url) })
if (!css.includes('(width >= 768px)') || css.includes('(width >= 900px)')) throw new Error('breakpoints not applied')
`
  )
  run('node', ['custom.mjs'], work)
  ok('pkg:@greese-ui/react/scss recompiles with custom breakpoints')

  // 5. Every per-component @import points at a shipped file.
  const cssDir = join(work, 'node_modules/@greese-ui/react/dist/css')
  for (const file of readdirSync(cssDir)) {
    for (const [, target] of readFileSync(join(cssDir, file), 'utf8').matchAll(
      /@import '\.\/([\w-]+\.css)'/g
    )) {
      if (!existsSync(join(cssDir, target)))
        throw new Error(`${file} imports missing ${target}`)
    }
  }
  ok(`${readdirSync(cssDir).length} per-component stylesheets, all imports resolve`)

  // 6. A bundler follows (and de-duplicates) the per-component import chain.
  writeFileSync(
    join(work, 'index.html'),
    '<script type="module" src="/main.js"></script>'
  )
  writeFileSync(
    join(work, 'main.js'),
    `import '@greese-ui/react/css/Dialog.css'\nimport '@greese-ui/react/css/Button.css'\n`
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
} finally {
  if (!process.env.KEEP) rmSync(work, { recursive: true, force: true })
}
console.log('Packages verified.')
