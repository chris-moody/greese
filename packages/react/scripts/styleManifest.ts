/**
 * The styling API of every component, read from its compiled CSS: classes,
 * parts, modifiers, responsive props, state attributes and custom
 * properties; and, from the TSX, which of those blocks each exported component
 * renders. build-css.ts writes it as dist/style-manifest.json (for docs
 * and Theme Studio) and src/styles/_manifest.scss (so the SCSS kit can
 * reject unknown names at compile time). Pure, and unit-tested.
 */

export interface BlockStyles {
  /** `Button`: what the SCSS kit's `component()` takes. */
  name: string
  /** `greese-Button`. */
  className: string
  /** The stylesheet that defines it: `css/<stylesheet>.css`. */
  stylesheet: string
  /** `icon` for `.greese-Button-icon`. */
  parts: string[]
  /** `solid` for `.greese-Button--solid`. Responsive classes are under `responsive`. */
  modifiers: string[]
  /** Modifiers of parts: `{ page: ['current'] }` for `.greese-Pagination-page--current`. */
  partModifiers: Record<string, string[]>
  /** Responsive props and their token classes: `{ width: ['full', 'auto'] }`. */
  responsive: Record<string, string[]>
  /** State attributes styled on the block or its parts: `[data-loading]`. */
  attributes: string[]
  /** Custom properties the block declares or reads, tokens excluded. */
  variables: string[]
}

/** What an exported component renders, by style block. */
export interface ComponentUse {
  /** Blocks whose classes it renders itself: `['AccordionItem']`. */
  blocks: string[]
  /** Exported components it renders: `['Collapsible']`. */
  renders: string[]
  /**
   * Blocks it gets from those, transitively, its own excluded: what else
   * styles it. AccordionItem is a Collapsible, so `['Collapsible']`.
   */
  builtOn: string[]
}

export interface StyleManifest {
  /** Bump when the shape changes. */
  version: 2
  blocks: Record<string, BlockStyles>
  /** By exported component name. */
  components: Record<string, ComponentUse>
}

const BREAKPOINT = /^(xs|sm|md|lg|xl)-([a-z][A-Za-z]*)(?:-(.+))?$/
const SELECTOR_CLASS = /\.greese-([A-Z][A-Za-z]*)(-[a-z][A-Za-z]*)?(--[A-Za-z0-9-]+)?/g
const ATTRIBUTES = /^((?:\[[^\]]+\])+)/
const VARIABLE = /--greese-[a-z0-9-]+/g
const RESPONSIVE_VAR = /-(xs|sm|md|lg|xl)$/

/** Every rule's selector list, at-rule preludes excluded. */
const selectorsOf = (css: string): string[] =>
  [...css.matchAll(/(?<=^|[{};])([^{};]+)\{/g)]
    .map((m) => m[1]!.trim())
    .filter((selector) => !selector.startsWith('@'))

const add = (map: Map<string, Set<string>>, key: string, value: string) => {
  if (!map.has(key)) map.set(key, new Set())
  map.get(key)!.add(value)
}

const sorted = (set: Set<string> | undefined): string[] => [...(set ?? [])].sort()

/**
 * @param compiled   stylesheet name → its compiled CSS
 * @param tokenVars  custom properties that are design tokens, left out
 */
export const styleManifest = (
  compiled: Map<string, string>,
  tokenVars: Set<string>,
  sources: Map<string, string> = new Map()
): StyleManifest => {
  const stylesheetOf = new Map<string, string>()
  const parts = new Map<string, Set<string>>()
  const modifiers = new Map<string, Set<string>>()
  const partModifiers = new Map<string, Set<string>>()
  const responsive = new Map<string, Map<string, Set<string>>>()
  const attributes = new Map<string, Set<string>>()
  const variables = new Map<string, Set<string>>()

  for (const [stylesheet, css] of compiled) {
    const own: string[] = []
    for (const selector of selectorsOf(css)) {
      for (const m of selector.matchAll(SELECTOR_CLASS)) {
        const [whole, block, part, modifier] = m as unknown as [
          string,
          string,
          string?,
          string?,
        ]
        // The same block in two sheets (a part styled from its parent's
        // file) belongs to the sheet named after it, else the first.
        if (!stylesheetOf.has(block) || stylesheet === block)
          stylesheetOf.set(block, stylesheet)
        own.push(block)
        if (part) add(parts, block, part.slice(1))
        if (modifier) {
          const name = modifier.slice(2)
          const bp = BREAKPOINT.exec(name)
          if (part) add(partModifiers, `${block}${part}`, name)
          else if (bp) {
            if (!responsive.has(block)) responsive.set(block, new Map())
            const props = responsive.get(block)!
            if (!props.has(bp[2]!)) props.set(bp[2]!, new Set())
            if (bp[3]) props.get(bp[2]!)!.add(bp[3])
          } else add(modifiers, block, name)
        }
        const rest = selector.slice(m.index! + whole.length)
        const attrs = ATTRIBUTES.exec(rest)?.[1]
        if (attrs) for (const a of attrs.match(/\[[^\]]+\]/g)!) add(attributes, block, a)
      }
    }

    // Variables belong to the block their name starts with, else to the
    // sheet's own block: --greese-file-height lives in FileInput.css.
    const blocks = [...new Set(own)].sort((a, b) => b.length - a.length)
    for (const v of new Set(css.match(VARIABLE) ?? [])) {
      if (tokenVars.has(v) || RESPONSIVE_VAR.test(v)) continue
      const owner =
        blocks.find((b) => v.startsWith(`--greese-${b.toLowerCase()}-`)) ??
        (blocks.includes(stylesheet) ? stylesheet : undefined)
      if (owner) add(variables, owner, v)
    }
  }

  const blocks: Record<string, BlockStyles> = {}
  for (const name of [...stylesheetOf.keys()].sort()) {
    blocks[name] = {
      name,
      className: `greese-${name}`,
      stylesheet: stylesheetOf.get(name)!,
      parts: sorted(parts.get(name)),
      modifiers: sorted(modifiers.get(name)),
      partModifiers: Object.fromEntries(
        sorted(parts.get(name))
          .filter((part) => partModifiers.has(`${name}-${part}`))
          .map((part) => [part, sorted(partModifiers.get(`${name}-${part}`))])
      ),
      responsive: Object.fromEntries(
        [...(responsive.get(name) ?? [])]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([prop, tokens]) => [prop, sorted(tokens)])
      ),
      attributes: sorted(attributes.get(name)),
      variables: sorted(variables.get(name)),
    }
  }
  return {
    version: 2,
    blocks,
    components: componentUses(sources, new Set(Object.keys(blocks))),
  }
}

const DECLARATION = /^(export )?(?:const|function) ([A-Za-z_]\w*)/gm
const CLASS_BLOCK = /greese-([A-Z][A-Za-z]*)/g
const JSX_TAG = /<([A-Z]\w*)/g
const STRING = /(['"`])(?:\\.|(?!\1)[^\\])*\1/g

interface Declaration {
  name: string
  exported: boolean
  blocks: Set<string>
  tags: Set<string>
  /** Other declarations in the same file it mentions. */
  locals: Set<string>
}

/**
 * Which style blocks each exported component renders, read from its source:
 * each file is split into its top-level declarations, and a component owns
 * the classes in its own body and in the local helpers it uses. `<Other>`
 * tags link it to the components it renders.
 *
 * @param sources  file path → TSX source, tests excluded
 * @param known    block names that have CSS
 */
export const componentUses = (
  sources: Map<string, string>,
  known: Set<string>
): Record<string, ComponentUse> => {
  const files = [...sources.values()].map((text) => {
    const found = [...text.matchAll(DECLARATION)]
    const names = new Set(found.map((m) => m[2]!))
    return new Map(
      found.map((m, i): [string, Declaration] => {
        // Comments hold TSDoc examples (`<Accordion>` in AccordionItem's):
        // they don't render anything.
        const body = text
          .slice(m.index, found[i + 1]?.index ?? text.length)
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '')
        const words = new Set(body.slice(m[0].length).match(/\b[A-Za-z_]\w*\b/g))
        return [
          m[2]!,
          {
            name: m[2]!,
            exported: !!m[1],
            blocks: new Set([...body.matchAll(CLASS_BLOCK)].map((c) => c[1]!)),
            // Tags from code only: error messages mention parents (`<Tabs>`).
            tags: new Set(
              [...body.replace(STRING, "''").matchAll(JSX_TAG)].map((t) => t[1]!)
            ),
            locals: new Set([...words].filter((w) => names.has(w) && w !== m[2])),
          },
        ]
      })
    )
  })

  const exported = new Set(
    files.flatMap((decls) =>
      [...decls.values()].filter((d) => d.exported).map((d) => d.name)
    )
  )
  const direct = new Map<string, { blocks: Set<string>; renders: Set<string> }>()
  for (const decls of files) {
    for (const decl of decls.values()) {
      if (!decl.exported || !/^[A-Z]/.test(decl.name)) continue
      const blocks = new Set<string>()
      const renders = new Set<string>()
      // This declaration and the local, unexported helpers it reaches.
      const seen = new Set<string>()
      const visit = (d: Declaration) => {
        if (seen.has(d.name)) return
        seen.add(d.name)
        for (const b of d.blocks) if (known.has(b)) blocks.add(b)
        for (const t of d.tags) if (exported.has(t) && t !== decl.name) renders.add(t)
        for (const l of d.locals) {
          const local = decls.get(l)!
          if (local.exported) {
            if (/^[A-Z]/.test(l) && d.tags.has(l)) renders.add(l)
          } else visit(local)
        }
      }
      visit(decl)
      direct.set(decl.name, { blocks, renders })
    }
  }

  const components: Record<string, ComponentUse> = {}
  for (const name of [...direct.keys()].sort()) {
    const own = direct.get(name)!
    const builtOn: string[] = []
    const queue = [...own.renders]
    const seen = new Set([name])
    while (queue.length) {
      const next = queue.shift()!
      if (seen.has(next)) continue
      seen.add(next)
      const use = direct.get(next)
      if (!use) continue
      for (const b of use.blocks)
        if (!own.blocks.has(b) && !builtOn.includes(b)) builtOn.push(b)
      queue.push(...use.renders)
    }
    components[name] = {
      blocks: [...own.blocks].sort(),
      renders: [...own.renders].sort(),
      builtOn,
    }
  }
  return components
}

const list = (items: string[]) =>
  items.length ? `(${items.map((i) => `'${i}'`).join(', ')},)` : '()'

const partMap = (b: BlockStyles) => {
  const entries = Object.entries(b.partModifiers)
  return entries.length
    ? `(${entries.map(([part, mods]) => `'${part}': ${list(mods)}`).join(', ')})`
    : '()'
}

/** The manifest as a Sass map, for the kit's compile-time name checks. */
export const manifestScss = (manifest: StyleManifest): string => {
  const entries = Object.values(manifest.blocks).map(
    (b) =>
      `  '${b.name}': (\n    parts: ${list(b.parts)},\n    modifiers: ${list(b.modifiers)},\n    part-modifiers: ${partMap(b)},\n    variables: ${list(b.variables)},\n  ),`
  )
  return `// GENERATED by scripts/build-css.ts from the component stylesheets - do not edit.
// The SCSS kit (_kit.scss) checks component, part and modifier names against it.
$blocks: (
${entries.join('\n')}
);
`
}
