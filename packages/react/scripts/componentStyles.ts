/**
 * Which style blocks each exported React component renders, read from its
 * TSX, so the docs and Theme Studio can say what styles a component and what
 * it's built on. The blocks themselves (parts, modifiers…) are @greese/ui's
 * style manifest; this is the React side of the mapping, and a framework
 * package would write its own. Pure, and unit-tested.
 */

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
