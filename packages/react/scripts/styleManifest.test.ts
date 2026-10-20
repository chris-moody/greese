// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { componentUses, manifestScss, styleManifest } from './styleManifest.ts'

const compiled = new Map([
  [
    'Thing',
    `@layer greese.components {
  .greese-Thing { --greese-thing-tone: var(--greese-color-accent); color: var(--greese-thing-fg, red); }
  .greese-Thing--solid, .greese-Thing--size-sm { border: 0; }
  .greese-Thing[data-loading] .greese-Thing-icon { opacity: 0; }
  .greese-Thing-step--next { order: 1; }
  .greese-ThingItem + .greese-ThingItem::before { content: '/'; }
  @media (width >= 900px) {
    .greese-Thing--md-width-full { inline-size: 100%; }
    .greese-Thing--md-width { inline-size: var(--greese-thing-width-md); }
  }
  .greese-Thing { --greese-loose-end: 1px; }
}`,
  ],
])

describe('styleManifest', () => {
  const { blocks } = styleManifest(compiled, new Set(['--greese-color-accent']))

  it('finds blocks, parts, modifiers and the sheet that defines them', () => {
    expect(Object.keys(blocks)).toEqual(['Thing', 'ThingItem'])
    expect(blocks.Thing).toMatchObject({
      className: 'greese-Thing',
      stylesheet: 'Thing',
      parts: ['icon', 'step'],
      modifiers: ['size-sm', 'solid'],
      partModifiers: { step: ['next'] },
      attributes: ['[data-loading]'],
    })
    expect(blocks.ThingItem!.stylesheet).toBe('Thing')
  })

  it('groups responsive classes by prop, apart from modifiers', () => {
    expect(blocks.Thing!.responsive).toEqual({ width: ['full'] })
  })

  it('keeps component variables, not tokens or per-breakpoint values', () => {
    expect(blocks.Thing!.variables).toEqual([
      '--greese-loose-end',
      '--greese-thing-fg',
      '--greese-thing-tone',
    ])
  })

  it('renders a Sass map for the kit', () => {
    expect(manifestScss({ version: 2, blocks, components: {} })).toContain(
      `'Thing': (\n    parts: ('icon', 'step',),\n    modifiers: ('size-sm', 'solid',),\n    part-modifiers: ('step': ('next',)),`
    )
  })
})

describe('componentUses', () => {
  const sources = new Map([
    [
      'Collapsible.tsx',
      `export const Collapsible = () => (
  <details className="greese-Collapsible"><summary className="greese-Collapsible-trigger" /></details>
)`,
    ],
    [
      'Accordion.tsx',
      `const Ctx = createContext(null)
const useItem = () => {
  if (!use(Ctx)) throw new Error('<AccordionItem> must be inside <Accordion>.')
}
const Marker = () => <span className="greese-AccordionMarker" />

/**
 * \`\`\`tsx
 * <Accordion><AccordionItem /></Accordion>
 * \`\`\`
 */
export const Accordion = (props) => <div className="greese-Accordion" {...props} />

// <Accordion> is for groups.
export const AccordionItem = () => {
  useItem()
  return <Collapsible className={cx('greese-AccordionItem')}><Marker /></Collapsible>
}`,
    ],
  ])
  const uses = componentUses(
    sources,
    new Set(['Accordion', 'AccordionItem', 'AccordionMarker', 'Collapsible'])
  )

  it('gives each export the classes in its body and its local helpers', () => {
    expect(uses.AccordionItem!.blocks).toEqual(['AccordionItem', 'AccordionMarker'])
    expect(uses.Accordion!.blocks).toEqual(['Accordion'])
  })

  it('follows rendered components, not examples in comments or error messages', () => {
    expect(uses.AccordionItem!.renders).toEqual(['Collapsible'])
    expect(uses.AccordionItem!.builtOn).toEqual(['Collapsible'])
    expect(uses.Accordion!.renders).toEqual([])
  })

  it('leaves out unexported helpers and blocks with no CSS', () => {
    expect(Object.keys(uses)).toEqual(['Accordion', 'AccordionItem', 'Collapsible'])
  })
})
