#!/usr/bin/env node
/**
 * GreeseUI (whole stylesheet, and per-component CSS) vs MUI: 2,000 responsive Stacks, production build, Chromium with 4x
 * CPU throttling (roughly a mid-range phone). Runs alternate between libraries
 * so machine noise hits both equally; medians are reported.
 *
 *   npm run bench -w playground          (builds first)
 *   node bench/run.ts --runs 9 --cpu 6   (reuse the last build)
 *   node bench/run.ts --json out.json    (also write the medians as JSON)
 *
 * Numbers are machine-dependent: compare the two columns, not across machines.
 */
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { chromium, type CDPSession } from '@playwright/test'

const { values: args } = parseArgs({
  options: {
    runs: { type: 'string', default: '5' },
    cpu: { type: 'string', default: '4' },
    toggles: { type: 'string', default: '4' },
    json: { type: 'string' },
  },
})
const RUNS = Number(args.runs)
const CPU = Number(args.cpu)
const TOGGLES = Number(args.toggles)
const PORT = 4311
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** `greeseCss`: GreeseUI with per-component CSS (css/Stack.css). */
type Lib = 'greese' | 'greeseCss' | 'mui'
const PAGE: Record<Lib, string> = {
  greese: 'bench-greese',
  greeseCss: 'bench-greese-css',
  mui: 'bench-mui',
}
interface Sample {
  navToPaint: number
  renderToPaint: number
  update: number
  inp: number
  scriptMs: number
  styleMs: number
  layoutMs: number
  updateScriptMs: number
  updateStyleMs: number
  jsKb: number
  styleElements: number
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

const startServer = async () => {
  const server = spawn(
    join(ROOT, '../../node_modules/.bin/vite'),
    ['preview', '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: 'ignore' }
  )
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`http://localhost:${PORT}`)).ok) return server
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  server.kill()
  throw new Error(`vite preview did not start on :${PORT}`)
}

const metrics = async (cdp: CDPSession) => {
  const { metrics: list } = (await cdp.send('Performance.getMetrics')) as {
    metrics: Array<{ name: string; value: number }>
  }
  const get = (name: string) => (list.find((m) => m.name === name)?.value ?? 0) * 1000
  return {
    script: get('ScriptDuration'),
    style: get('RecalcStyleDuration'),
    layout: get('LayoutDuration'),
  }
}

const sample = async (lib: Lib): Promise<Sample> => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Performance.enable')
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })

  await page.goto(`http://localhost:${PORT}/?page=${PAGE[lib]}`)
  await page.waitForFunction(() => window.__bench !== undefined, null, {
    timeout: 60_000,
  })
  const load = await metrics(cdp)

  for (let i = 1; i <= TOGGLES; i++) {
    await page.getByTestId('toggle').click()
    await page.waitForFunction((n) => window.__bench!.updates.length >= n, i)
  }
  const after = await metrics(cdp)

  const result = await page.evaluate(() => window.__bench!)
  const jsKb = await page.evaluate(
    () =>
      performance
        .getEntriesByType('resource')
        .filter(
          (e) =>
            (e as PerformanceResourceTiming).initiatorType === 'script' ||
            e.name.endsWith('.js')
        )
        .reduce((n, e) => n + (e as PerformanceResourceTiming).decodedBodySize, 0) / 1024
  )
  await browser.close()

  return {
    navToPaint: result.navToPaint,
    renderToPaint: result.renderToPaint,
    update: median(result.updates),
    inp: result.maxInteraction,
    scriptMs: load.script,
    styleMs: load.style,
    layoutMs: load.layout,
    updateScriptMs: (after.script - load.script) / TOGGLES,
    updateStyleMs: (after.style - load.style) / TOGGLES,
    jsKb,
    styleElements: result.styleElements,
  }
}

const server = await startServer()
try {
  const samples: Record<Lib, Sample[]> = { greese: [], greeseCss: [], mui: [] }
  const libs: Lib[] = ['greese', 'greeseCss', 'mui']
  for (let run = 0; run < RUNS; run++) {
    // Rotate the order each run so warm-up effects don't favour one side.
    const order = libs.map((_, i) => libs[(i + run) % libs.length]!)
    for (const lib of order) samples[lib].push(await sample(lib))
    process.stdout.write(`run ${run + 1}/${RUNS} done\n`)
  }

  const rows: Array<[label: string, key: keyof Sample, unit: string]> = [
    ['First paint from navigation', 'navToPaint', 'ms'],
    ['Render to first paint', 'renderToPaint', 'ms'],
    ['Main-thread script (load)', 'scriptMs', 'ms'],
    ['Style recalculation (load)', 'styleMs', 'ms'],
    ['Layout (load)', 'layoutMs', 'ms'],
    ['Update: click to paint', 'update', 'ms'],
    ['Update: script per toggle', 'updateScriptMs', 'ms'],
    ['Update: style recalc per toggle', 'updateStyleMs', 'ms'],
    ['Longest interaction (INP basis)', 'inp', 'ms'],
    ['JavaScript executed (uncompressed)', 'jsKb', 'kB'],
    ['<style> elements in the document', 'styleElements', ''],
  ]
  const medians = rows.map(([label, key, unit]) => ({
    label,
    key,
    unit,
    greese: median(samples.greese.map((x) => x[key])),
    greeseCss: median(samples.greeseCss.map((x) => x[key])),
    mui: median(samples.mui.map((x) => x[key])),
  }))
  if (args.json)
    writeFileSync(
      args.json,
      `${JSON.stringify({ runs: RUNS, cpu: CPU, stacks: 2000, date: new Date().toISOString().slice(0, 10), metrics: medians }, null, 2)}\n`
    )
  const fmt = (n: number) => (n >= 100 ? n.toFixed(0) : n.toFixed(1))
  console.log(
    `\n2,000 responsive Stacks, ${RUNS} runs, ${CPU}x CPU throttle, medians\n\n` +
      `| Metric | GreeseUI | GreeseUI, per-component CSS | MUI | MUI / GreeseUI | MUI / per-component |\n|---|---:|---:|---:|---:|---:|\n` +
      medians
        .map(({ label, unit, greese: s, greeseCss: c, mui: m }) => {
          const ratio = (x: number) => (x > 0 ? `${(m / x).toFixed(1)}x` : '-')
          return `| ${label} | ${fmt(s)} ${unit} | ${fmt(c)} ${unit} | ${fmt(m)} ${unit} | ${ratio(s)} | ${ratio(c)} |`
        })
        .join('\n')
  )
} finally {
  server.kill()
}
