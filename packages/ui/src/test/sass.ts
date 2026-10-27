import { fileURLToPath } from 'node:url'
import { compileString, NodePackageImporter } from 'sass-embedded'

/** The library's own stylesheets: what `@use 'kit'`, `'mixins'` and `'index'` load. */
export const STYLES = fileURLToPath(new URL('../styles/', import.meta.url))

/** The repository root, where `@greese/ui` is installed as a project installs it. */
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))

/** Compiles SCSS against the library's source stylesheets, as its own sheets are built. */
export const compileScss = (scss: string): string =>
  compileString(scss, {
    loadPaths: [STYLES],
    importers: [new NodePackageImporter()],
  }).css

/** Compiles as a project does: by package URL, from outside the package. */
export const compileAsProject = (scss: string): string =>
  compileString(scss, {
    importers: [new NodePackageImporter(ROOT)],
    url: new URL(`file://${ROOT}theme.scss`),
  }).css

/** A block of compiled CSS: the preludes around it, its own prelude, its declarations. */
export interface Block {
  within: string[]
  prelude: string
  declarations: Array<[string, string]>
}

const tidy = (text: string) => text.replace(/\s+/g, ' ').trim()

/**
 * Reads compiled CSS into its blocks, in source order, without Sass's line
 * breaks and indentation, so tests compare structure rather than formatting.
 * A statement outside any declaration (`@layer a, b;`) is a block with no
 * declarations. Parentheses are respected; braces and semicolons inside
 * strings aren't, and compiled kit output has none.
 */
export const blocks = (css: string): Block[] => {
  const found: Block[] = []
  const open: Block[] = []
  let text = ''
  let parens = 0
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (ch === '(') parens++
    else if (ch === ')') parens--
    if (parens > 0 || !'{};'.includes(ch)) {
      text += ch
      continue
    }
    const within = open.map((b) => b.prelude)
    if (ch === '{') {
      const block: Block = { within, prelude: tidy(text), declarations: [] }
      found.push(block)
      open.push(block)
    } else if (open.length && text.includes(':') && !tidy(text).startsWith('@')) {
      const at = text.indexOf(':')
      open.at(-1)!.declarations.push([tidy(text.slice(0, at)), tidy(text.slice(at + 1))])
    } else if (ch === ';' && tidy(text)) {
      found.push({ within, prelude: tidy(text), declarations: [] })
    }
    if (ch === '}') open.pop()
    text = ''
  }
  return found
}

/** A selector list's selectors; commas inside `:not(…)` and the like don't split. */
const selectors = (prelude: string) => prelude.split(/,(?![^(]*\))/).map((s) => s.trim())

/**
 * Every block with this prelude, or with a selector list that includes it,
 * as `{ within, declarations }`.
 */
export const rules = (css: string, prelude: string) =>
  blocks(css)
    .filter((b) => b.prelude === prelude || selectors(b.prelude).includes(prelude))
    .map(({ within, declarations }) => ({ within, declarations }))
