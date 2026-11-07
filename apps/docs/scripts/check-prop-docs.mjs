/**
 * Fails when a prop greese ui declares has no description: every row of every
 * props table should say what the prop does, not just its type. Props React
 * or the DOM declare (onClick, aria-*) are left to their own docs.
 *
 * Uses react-docgen-typescript, the same parser the docs build uses.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import docgen from 'react-docgen-typescript'

const here = dirname(fileURLToPath(import.meta.url))
const react = join(here, '../../../packages/react')
const componentsDir = join(react, 'src/components')
const svgDir = join(react, 'src/svg')
const authoringSrc = join(here, '../../../packages/authoring/src')

const files = readdirSync(componentsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    readdirSync(join(componentsDir, d.name))
      .filter((f) => /\.tsx$/.test(f) && !f.includes('.test.'))
      .map((f) => join(componentsDir, d.name, f))
  )
  .concat(
    readdirSync(svgDir)
      .filter((f) => /^[A-Z]\w*\.tsx$/.test(f))
      .map((f) => join(svgDir, f))
  )
  // @greese/authoring's components, timeline and panels (ADR 0035).
  .concat(
    ['components', 'timeline', 'panels'].flatMap((dir) =>
      readdirSync(join(authoringSrc, dir), { recursive: true, encoding: 'utf8' })
        .filter((f) => /(^|\/)[A-Z]\w*\.tsx$/.test(f) && !f.includes('.test.'))
        .map((f) => join(authoringSrc, dir, f))
    )
  )

// Only what the library exports: internal helpers have no props table.
const barrel = readFileSync(join(componentsDir, 'index.ts'), 'utf8')
const exported = new Set()
for (const [, file] of barrel.matchAll(/export \* from '\.\/(.+)'/g)) {
  const source = readFileSync(join(componentsDir, file), 'utf8')
  for (const [, name] of source.matchAll(/^export (?:const|function) ([A-Z]\w*)/gm))
    exported.add(name)
}

const svgBarrel = readFileSync(join(svgDir, 'index.ts'), 'utf8')
for (const [, names] of svgBarrel.matchAll(/export \{([^}]+)\} from '\.\/.+\.tsx'/g))
  for (const name of names.split(',').map((n) => n.trim()))
    if (/^[A-Z]/.test(name) && !/^[A-Z0-9_]+$/.test(name)) exported.add(name)

const authoringBarrel = readFileSync(join(authoringSrc, 'index.ts'), 'utf8')
for (const [, names] of authoringBarrel.matchAll(
  /export \{([^}]+)\} from '\.\/.+\.tsx'/g
))
  for (const name of names.split(',').map((n) => n.trim()))
    if (/^[A-Z]/.test(name) && !/^[A-Z0-9_]+$/.test(name)) exported.add(name)

const parser = docgen.withCustomConfig(join(react, 'tsconfig.json'), {
  savePropValueAsString: true,
  // Only props declared in the library itself.
  propFilter: (prop) => !prop.parent || !prop.parent.fileName.includes('node_modules'),
})

const missing = []
for (const doc of parser.parse(files).filter((d) => exported.has(d.displayName))) {
  for (const [name, prop] of Object.entries(doc.props)) {
    if (!prop.description.trim()) {
      const where = prop.parent
        ? prop.parent.fileName.replace(/^.*packages\/(react|authoring)\//, '$1/')
        : 'unknown'
      missing.push(`  ${doc.displayName}.${name}  (${where})`)
    }
  }
}

if (missing.length) {
  console.error(
    `Props without a description (${missing.length}): add TSDoc saying what each does.`
  )
  console.error([...new Set(missing)].join('\n'))
  process.exit(1)
}
console.log('Prop docs: every prop greese ui declares has a description.')
