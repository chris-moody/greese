#!/usr/bin/env node
/**
 * Writes the shape and motion themes and the color variants
 * (src/studio/shapes.ts, motions.ts, variants.ts) into
 * @greese/ui as `themes/<id>.scss`, the kit source, and `themes/<id>.css`,
 * compiled: each one layer only (ADR 0025), so they compose with any
 * other. A test (server/shapes.test.ts) fails while the files are stale.
 *
 *   npm run themes -w site
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { themeFile } from '../server/shapes.ts'
import { MOTIONS } from '../src/studio/motions.ts'
import { SHAPES } from '../src/studio/shapes.ts'
import { VARIANTS } from '../src/studio/variants.ts'

const out = join(dirname(fileURLToPath(import.meta.url)), '../../../packages/ui/themes')
mkdirSync(out, { recursive: true })
for (const [presets, kind] of [
  [SHAPES, 'shape'],
  [MOTIONS, 'motion'],
  [VARIANTS, 'variant'],
] as const)
  for (const preset of presets) {
    const { scss, css } = themeFile(preset, kind)
    writeFileSync(join(out, `${preset.id}.scss`), scss)
    writeFileSync(join(out, `${preset.id}.css`), css)
  }
console.log(
  `wrote ${SHAPES.length} shape and ${MOTIONS.length} motion themes and ${VARIANTS.length} color variant to packages/ui/themes`
)
