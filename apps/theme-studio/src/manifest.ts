import manifest from '@greese-ui/react/style-manifest.json' with { type: 'json' }

/** One component's styling API, from the library's build (scripts/styleManifest.ts). */
export interface BlockStyles {
  name: string
  className: string
  stylesheet: string
  parts: string[]
  modifiers: string[]
  partModifiers: Record<string, string[]>
  responsive: Record<string, string[]>
  attributes: string[]
  variables: string[]
}

export const blocks = manifest.blocks as Record<string, BlockStyles>

export const blockNames = Object.keys(blocks).sort()

const BLOCK = /^greese-([A-Z][A-Za-z]*)/

/** The component a class belongs to: `greese-Button-icon` → `Button`. */
export const blockOf = (cls: string): string | undefined => {
  const name = BLOCK.exec(cls)?.[1]
  return name && blocks[name] ? name : undefined
}
