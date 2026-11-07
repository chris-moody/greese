/**
 * Every component's description and props, for the docs' pages:
 *
 *   virtual:greese-docgen  react-docgen-typescript over packages/react (its
 *                          components and @greese/react/svg) and
 *                          packages/icons and packages/authoring, as
 *                          Storybook reads them (same
 *                          parser, same filter), keyed by component name
 *
 * About a second for the whole library; redone when a component's source
 * changes, so the props tables follow edits.
 */
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import docgen from 'react-docgen-typescript'
import type { Plugin } from 'vite'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const COMPONENTS = join(ROOT, 'packages/react/src/components')
const SVG = join(ROOT, 'packages/react/src/svg')
const ICONS = join(ROOT, 'packages/icons/src')
const AUTHORING = join(ROOT, 'packages/authoring/src/components')
const ID = 'virtual:greese-docgen'

export interface PropDoc {
  name: string
  /** As written: `ControlSize`, `Responsive<boolean>`, `ReactNode`. */
  type: string
  /** The string literals it takes, when it's a union of them: what a control offers. */
  options?: string[]
  required: boolean
  default?: string
  description: string
}

export interface ComponentDoc {
  description: string
  props: PropDoc[]
}

const sources = (): string[] => [
  ...readdirSync(COMPONENTS, { recursive: true, encoding: 'utf8' })
    .filter((f) => /^[A-Z]\w*\/[A-Z]\w*\.tsx$/.test(f))
    .map((f) => join(COMPONENTS, f)),
  ...readdirSync(SVG)
    .filter((f) => /^[A-Z]\w*\.tsx$/.test(f))
    .map((f) => join(SVG, f)),
  ...readdirSync(AUTHORING, { recursive: true, encoding: 'utf8' })
    .filter((f) => /^[A-Z]\w*\/[A-Z]\w*\.tsx$/.test(f))
    .map((f) => join(AUTHORING, f)),
  join(ICONS, 'icons.tsx'),
  join(ICONS, 'createIcon.tsx'),
]

export const componentDocs = (): Record<string, ComponentDoc> => {
  const parser = docgen.withCustomConfig(join(ROOT, 'packages/react/tsconfig.json'), {
    savePropValueAsString: true,
    shouldRemoveUndefinedFromOptional: true,
    shouldExtractLiteralValuesFromEnum: true,
    // Only props the library declares; React's and the DOM's have their own docs.
    propFilter: (prop) => !prop.parent || !prop.parent.fileName.includes('node_modules'),
  })
  const docs: Record<string, ComponentDoc> = {}
  for (const doc of parser.parse(sources())) {
    if (docs[doc.displayName]) continue
    docs[doc.displayName] = {
      description: doc.description,
      props: Object.values(doc.props)
        .map((p): PropDoc => {
          const literals = (p.type.value as Array<{ value: string }> | undefined)
            ?.map((v) => /^"(.*)"$/.exec(v.value)?.[1])
            .filter((v): v is string => v !== undefined)
          const enumerated = p.type.name === 'enum' && literals?.length
          return {
            name: p.name,
            type: enumerated
              ? (p.type.raw ?? literals.map((v) => `"${v}"`).join(' | '))
              : p.type.name,
            ...(enumerated && { options: literals }),
            required: p.required,
            ...(p.defaultValue?.value !== undefined && {
              default: String(p.defaultValue.value),
            }),
            description: p.description,
          }
        })
        // Required first, then as written.
        .sort((a, b) => Number(b.required) - Number(a.required)),
    }
  }
  return docs
}

export const docgenDocs = (): Plugin => {
  let cached: string | undefined
  return {
    name: 'greese-docgen',
    resolveId: (id) => (id === ID ? `\0${id}` : undefined),
    load(id) {
      if (id !== `\0${ID}`) return
      for (const file of sources()) this.addWatchFile(file)
      cached ??= `export default ${JSON.stringify(componentDocs())}`
      return cached
    },
    // A component edited: the next load parses again.
    watchChange(file) {
      if ([COMPONENTS, SVG, ICONS].some((dir) => file.startsWith(dir))) cached = undefined
    },
    handleHotUpdate({ file, server }) {
      if (![COMPONENTS, SVG, ICONS].some((dir) => file.startsWith(dir))) return
      cached = undefined
      const module = server.moduleGraph.getModuleById(`\0${ID}`)
      if (module) server.moduleGraph.invalidateModule(module)
    },
  }
}
