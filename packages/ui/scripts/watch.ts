#!/usr/bin/env node
/**
 * Keeps dist/ current while `npm run dev` runs: `tsc --watch` for the
 * modules, and the token, utility and style builds again whenever src/
 * changes. The apps read @greese/ui's dist/, so their dev servers reload once
 * a rebuild lands.
 */
import { spawn } from 'node:child_process'
import { watch } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const STEPS = ['build-tokens.ts', 'build-utilities.ts', 'build-styles.ts']

const tsc = spawn(
  'npx',
  ['tsc', '-p', 'tsconfig.build.json', '--watch', '--preserveWatchOutput'],
  { cwd: ROOT, stdio: 'inherit' }
)
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    tsc.kill(signal)
    process.exit()
  })

const run = (script: string) =>
  new Promise<boolean>((resolve) => {
    spawn(process.execPath, [join(ROOT, 'scripts', script)], {
      cwd: ROOT,
      stdio: 'inherit',
    }).on('exit', (code) => resolve(code === 0))
  })

let running = false
let queued = false
let timer: ReturnType<typeof setTimeout> | undefined

const rebuild = async () => {
  if (running) {
    queued = true
    return
  }
  running = true
  const start = performance.now()
  let ok = true
  for (const step of STEPS) if (!(ok = await run(step))) break
  console.log(
    ok
      ? `styles rebuilt in ${((performance.now() - start) / 1000).toFixed(1)} s`
      : 'styles failed to build; fix the error and save again'
  )
  running = false
  if (queued) {
    queued = false
    void rebuild()
  }
}

watch(join(ROOT, 'src'), { recursive: true }, (_event, file) => {
  if (!file || /\.test\.ts$|(^|\/)test\//.test(file)) return
  clearTimeout(timer)
  timer = setTimeout(rebuild, 150)
})
console.log('watching src/ for style changes')
