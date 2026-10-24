#!/usr/bin/env node
/**
 * Writes dist/data.json: everything the server answers from, gathered from the
 * repository at build time so the published package never reads it (ADR 0022).
 *
 * - components: react-docgen-typescript over packages/react (the parser the
 *   docs use), each with its style-manifest entry and its stories file;
 * - tokens: imported from @greese/ui, so they are the real values;
 * - icons: the exports of packages/icons/src/icons.tsx;
 * - guides: apps/docs/stories/guides/*.mdx;
 * - themes: the shape themes' kit SCSS and CSS (packages/ui/themes);
 * - templates: the site's templates (apps/site/src/templates).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import docgen from 'react-docgen-typescript'
import { breakpoints, color, palette, scalarTokens, typography } from '@greese/ui'
import type {
  ComponentDoc,
  GreeseData,
  Guide,
  PropDoc,
  StyleEntry,
  Template,
  ThemeDoc,
} from '../src/data.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../../..')
const at = (...path: string[]) => join(root, ...path)
const read = (path: string) => readFileSync(path, 'utf8')
const files = (dir: string, pattern: RegExp): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { recursive: true, encoding: 'utf8' })
        .filter((f) => pattern.test(f))
        .sort()
        .map((f) => join(dir, f))
    : []

// Components: what the barrel exports, documented by docgen.
const componentsDir = at('packages/react/src/components')
const exported = new Set<string>()
for (const [, file] of read(join(componentsDir, 'index.ts')).matchAll(
  /export \* from '\.\/(.+)'/g
)) {
  for (const [, name] of read(join(componentsDir, file!)).matchAll(
    /^export (?:const|function) ([A-Z]\w*)/gm
  ))
    exported.add(name!)
}

const parser = docgen.withCustomConfig(at('packages/react/tsconfig.json'), {
  savePropValueAsString: true,
  shouldRemoveUndefinedFromOptional: true,
  // The library's own props: React's and the DOM's have their own docs.
  propFilter: (prop) => !prop.parent || !prop.parent.fileName.includes('node_modules'),
})
const docs = parser.parse(
  files(componentsDir, /\/[A-Z]\w*\.tsx$/).filter((f) => !f.includes('.test.'))
)

const manifest = JSON.parse(read(at('packages/ui/dist/style-manifest.json'))) as {
  blocks: Record<string, StyleEntry & { stylesheet?: string }>
}

// Stories by the component their meta documents.
const stories = new Map<string, { category: string; source: string }>()
for (const file of files(at('apps/docs/stories'), /\.stories\.tsx$/)) {
  const source = read(file)
  const title = /title: '([^/']+)\/([^']+)'/.exec(source)
  const component = /component: (\w+)/.exec(source)
  if (title && component) stories.set(component[1]!, { category: title[1]!, source })
}

const components: ComponentDoc[] = docs
  .filter((d) => exported.has(d.displayName))
  .map((d) => {
    const props: PropDoc[] = Object.values(d.props)
      .map((p) => ({
        name: p.name,
        type: p.type.name,
        required: p.required,
        ...(p.defaultValue?.value !== undefined && {
          default: String(p.defaultValue.value),
        }),
        description: p.description,
      }))
      .sort(
        (a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name)
      )
    const block = manifest.blocks[d.displayName]
    const story = stories.get(d.displayName)
    return {
      name: d.displayName,
      category: story?.category ?? 'Other',
      description: d.description,
      file: relative(root, d.filePath),
      props,
      ...(block && {
        styles: {
          className: block.className,
          parts: block.parts,
          modifiers: block.modifiers,
          attributes: block.attributes,
          variables: block.variables,
        },
      }),
      ...(story && { example: story.source }),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

// Guides: the MDX, with imports and JSX-only lines left out.
const guides: Guide[] = files(at('apps/docs/stories/guides'), /\.mdx$/).map((file) => {
  const text = read(file)
    .split('\n')
    .filter((line) => !/^(import |export |<Meta)/.test(line))
    .join('\n')
    .trim()
  const name = basename(file, '.mdx')
  return { name, title: /^# (.+)$/m.exec(text)?.[1] ?? name, text }
})

const icons = [
  ...read(at('packages/icons/src/icons.tsx')).matchAll(/^export const (\w+Icon)\b/gm),
].map((m) => m[1]!)

// Shape themes: <id>.scss (the kit source) and <id>.css (compiled), with the
// first comment as the description.
const themes: ThemeDoc[] = files(at('packages/ui/themes'), /\.scss$/).map((file) => {
  const scss = read(file)
  const id = basename(file, '.scss')
  const css = file.replace(/\.scss$/, '.css')
  const lead = /^\/\*\*?([\s\S]*?)\*\//.exec(scss)?.[1] ?? ''
  const description = lead
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ')
  return { id, description, scss, css: existsSync(css) ? read(css) : '' }
})

// Templates: each file's TSDoc, then its source.
const templates: Template[] = files(at('apps/site/src/templates'), /^[A-Z]\w*\.tsx$/).map(
  (file) => {
    const source = read(file)
    const id = basename(file, '.tsx').toLowerCase()
    const lead = /\/\*\*([\s\S]*?)\*\//.exec(source)?.[1] ?? ''
    const description = lead
      .split('\n')
      .map((l) => l.replace(/^\s*\*\s?/, '').trim())
      .filter(Boolean)
      .join(' ')
    return { id, description, source }
  }
)

// The layout rules every template shares, served with each one.
const templateStylesFile = at('apps/site/src/templates/templates.scss')
const templateStyles = existsSync(templateStylesFile) ? read(templateStylesFile) : ''

const version = (JSON.parse(read(join(here, '../package.json'))) as { version: string })
  .version

const data: GreeseData = {
  version,
  components,
  tokens: { color, ...scalarTokens, breakpoints, palette, typography },
  icons,
  guides,
  themes,
  templates,
  templateStyles,
}

mkdirSync(join(here, '../dist'), { recursive: true })
writeFileSync(join(here, '../dist/data.json'), JSON.stringify(data))
console.log(
  `wrote dist/data.json: ${components.length} components, ${guides.length} guides, ${icons.length} icons, ${themes.length} themes, ${templates.length} templates`
)
