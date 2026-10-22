#!/usr/bin/env node
/**
 * Writes dist/utilities.css: every utility class, from src/utilities.ts. Most
 * projects want only the ones they use: `greese-utilities` and the Vite plugin
 * write that from the same table.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateUtilities } from '../src/utilities.ts'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '../dist')
mkdirSync(DIST, { recursive: true })
const css = generateUtilities()
writeFileSync(join(DIST, 'utilities.css'), css)
console.log(`wrote dist/utilities.css (${(css.length / 1024).toFixed(0)} kB raw)`)
