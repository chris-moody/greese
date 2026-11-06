/**
 * Which style blocks a component's docs and Theme Studio treat as its own,
 * from the library's data. No Storybook or DOM imports: the site's server
 * uses it too.
 */
import manifest from '@greese/ui/style-manifest.json' with { type: 'json' }
import componentStyles from '@greese/react/component-styles.json' with { type: 'json' }

interface ComponentUse {
  blocks: string[]
  renders: string[]
  builtOn: string[]
}

const blocks = manifest.blocks as Record<string, unknown>
const components = componentStyles.components as Record<string, ComponentUse>

/**
 * Motion's classes are the `greese` prop's effects: a component that applies
 * one (Carousel's slide exits) renders them, but they're documented on
 * Motion's page and in Guides/Animation, not as the component's own.
 */
const SHARED_BLOCKS = new Set(['Motion'])
export const ownBlocks = (name: string): string[] =>
  (components[name]?.blocks ?? []).filter((b) => !SHARED_BLOCKS.has(b) || b === name)

/**
 * Every style block that styles a component, in the order they nest: its own,
 * then those of the components that go inside it (its `subcomponents`) and what
 * they're built on, then what it's built on itself. Accordion: Accordion,
 * AccordionItem, Collapsible. What the anatomy labels.
 */
export const familyOf = (
  name: string,
  subcomponents: readonly string[] = []
): string[] => {
  const ordered = [
    ...(components[name] ? ownBlocks(name) : [name]),
    ...subcomponents.flatMap((item) => [
      ...(components[item] ? ownBlocks(item) : [item]),
      ...(components[item]?.builtOn ?? []),
    ]),
    ...(components[name]?.builtOn ?? []),
  ]
  return ordered.filter((b, i) => blocks[b] && ordered.indexOf(b) === i)
}
