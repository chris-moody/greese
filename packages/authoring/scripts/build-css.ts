#!/usr/bin/env node
/**
 * Compiles @greese/authoring's stylesheet, src/styles/index.scss, to
 * dist/styles.css. The SCSS loads greese ui's mixins through Sass's package
 * importer (`pkg:@greese/ui/scss/mixins`), so it builds against the installed
 * @greese/ui (ADR 0035).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile, NodePackageImporter } from 'sass-embedded'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const { css } = compile(join(ROOT, 'src/styles/index.scss'), {
  importers: [new NodePackageImporter(ROOT)],
})

mkdirSync(join(ROOT, 'dist'), { recursive: true })
writeFileSync(join(ROOT, 'dist/styles.css'), `${css}\n`)
