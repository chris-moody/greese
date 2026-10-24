import componentStyles from '@greese/react/component-styles.json' with { type: 'json' }
import { blocks } from './manifest.ts'
import { subcomponentsOf } from './preview/stories.ts'

interface ComponentUse {
  blocks: string[]
  renders: string[]
  builtOn: string[]
}

const uses = componentStyles.components as Record<string, ComponentUse>

/**
 * Every style block that styles a component, in the order they nest: its own,
 * then those of the components that go inside it (its `subcomponents`) and what
 * they are built on, then what it is built on itself. Accordion: Accordion,
 * AccordionItem, Collapsible. From the library's own data (what each
 * component renders, read from its source) and the stories, never a list.
 */
export const familyOf = async (name: string): Promise<string[]> => {
  const own = uses[name]
  const items = await subcomponentsOf(name)
  const ordered = [
    ...(own?.blocks ?? [name]),
    ...items.flatMap((item) => [
      ...(uses[item]?.blocks ?? [item]),
      ...(uses[item]?.builtOn ?? []),
    ]),
    ...(own?.builtOn ?? []),
  ]
  return ordered.filter((b, i) => blocks[b] && ordered.indexOf(b) === i)
}
