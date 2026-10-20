// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { componentUses } from './componentStyles.ts'

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
