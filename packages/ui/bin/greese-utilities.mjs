#!/usr/bin/env node
// greese-utilities: writes the utility classes a project uses, or all of them.
//
//   greese-utilities --content "index.html" --content "src/**/*.{ts,tsx}" --out public/utilities.css
//   greese-utilities --all --out utilities.css
//
// Options: --content <glob> (repeat), --out <file> (else stdout), --all (every
// class, no scanning), --safelist <class> (repeat), --groups <a,b> (only these),
// --prefix <name> (default none), --cwd <dir>.
import { writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { generateUtilities } from '../dist/utilities.js'
import { purgeFiles } from '../dist/utilitiesFiles.js'

const { values } = parseArgs({
  options: {
    content: { type: 'string', multiple: true },
    out: { type: 'string' },
    all: { type: 'boolean' },
    safelist: { type: 'string', multiple: true },
    groups: { type: 'string' },
    prefix: { type: 'string' },
    cwd: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
})

if (values.help || (!values.all && !values.content?.length)) {
  console.error(
    'usage: greese-utilities (--content <glob>... | --all) [--out <file>] [--safelist <class>...] [--groups a,b] [--prefix <name>]'
  )
  process.exit(values.help ? 0 : 1)
}

const options = {
  ...(values.prefix && { prefix: values.prefix }),
  ...(values.groups && { groups: values.groups.split(',') }),
}

let css
if (values.all) css = generateUtilities(options)
else {
  const result = await purgeFiles({
    ...options,
    content: values.content,
    safelist: values.safelist ?? [],
    cwd: values.cwd,
  })
  css = result.css
  console.error(`greese-utilities: read ${result.files.length} files`)
}

if (values.out) {
  await writeFile(values.out, css)
  console.error(`greese-utilities: wrote ${values.out} (${css.length} bytes)`)
} else process.stdout.write(css)
