#!/usr/bin/env node
/**
 * Screenshots each template for the gallery's cards, light and dark:
 * src/templates/shots/<id>-<scheme>.webp, 800 × 450, the top of the page as a
 * visitor first sees it (motion settled, the site's own theme).
 *
 *   npm run shots -w site      after changing a template, or adding one
 *
 * Runs the app's dev server and Playwright's Chromium; the browser re-encodes
 * each screenshot as WebP itself, so no image library is needed.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src/templates/shots')
const WIDTH = 1280
const HEIGHT = 720
const SHOT = { width: 800, height: 450 }

/** The templates' ids, from the registry (as vite.config.ts reads them). */
export const templateIds = (): string[] =>
  [
    ...readFileSync(join(ROOT, 'src/templates/index.ts'), 'utf8').matchAll(
      /^ {4}id: '([a-z0-9-]+)'/gm
    ),
  ].map((m) => m[1]!)

const server = await createServer({
  root: ROOT,
  server: { port: 0, strictPort: false },
  logLevel: 'error',
})
await server.listen()
const base = server.resolvedUrls!.local[0]!.replace(/\/$/, '')
const browser = await chromium.launch()
mkdirSync(OUT, { recursive: true })

try {
  for (const id of templateIds())
    for (const scheme of ['light', 'dark'] as const) {
      const context = await browser.newContext({
        viewport: { width: WIDTH, height: HEIGHT + 200 },
        colorScheme: scheme,
        reducedMotion: 'reduce',
      })
      await context.addInitScript((s) => localStorage.setItem('greese-scheme', s), scheme)
      const page = await context.newPage()
      await page.goto(`${base}/templates/${id}`, { waitUntil: 'networkidle' })
      // The template itself: what follows the bar with the back link.
      const bar = page.locator('.tpl-bar')
      await bar.waitFor()
      await page.locator('.tpl-bar + *').waitFor()
      await page.waitForTimeout(800)
      const top = (await bar.boundingBox())!
      const png = await page.screenshot({
        clip: { x: 0, y: top.y + top.height, width: WIDTH, height: HEIGHT },
      })
      const webp = await page.evaluate(
        async ({ data, size }) => {
          const bitmap = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${data}`)).blob()
          )
          const canvas = new OffscreenCanvas(size.width, size.height)
          canvas.getContext('2d')!.drawImage(bitmap, 0, 0, size.width, size.height)
          const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 })
          const bytes = new Uint8Array(await blob.arrayBuffer())
          let text = ''
          for (const byte of bytes) text += String.fromCharCode(byte)
          return btoa(text)
        },
        { data: png.toString('base64'), size: SHOT }
      )
      const file = join(OUT, `${id}-${scheme}.webp`)
      writeFileSync(file, Buffer.from(webp, 'base64'))
      console.log(`${id}-${scheme}.webp`, Buffer.from(webp, 'base64').length, 'bytes')
      await context.close()
    }
} finally {
  await browser.close()
  await server.close()
}
