#!/usr/bin/env node
/**
 * Writes dist/utilities.css: every utility class, from src/utilities.ts. Most
 * projects want only the ones they use: `greese-utilities` and the Vite plugin
 * write that from the same table. Also dist/_utilities-table.scss, the table
 * as Sass, for `pkg:@greese/ui/scss/utilities`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateUtilities, utilitiesScss } from '../src/utilities.ts'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '../dist')
mkdirSync(DIST, { recursive: true })
const css = generateUtilities()
writeFileSync(join(DIST, 'utilities.css'), css)
writeFileSync(join(DIST, '_utilities-table.scss'), utilitiesScss())
console.log(
  `wrote dist/_utilities-table.scss and dist/utilities.css (${(css.length / 1024).toFixed(0)} kB raw)`
)
