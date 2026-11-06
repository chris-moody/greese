import { familyOf as familyWith } from '../../../docs/stories/_shared/family.ts'
import { subcomponentsOf } from './preview/stories.ts'

/**
 * Every style block that styles a component, in the order they nest: its own,
 * then those of the components that go inside it (its `subcomponents`) and what
 * they are built on, then what it is built on itself. Accordion: Accordion,
 * AccordionItem, Collapsible. From the library's own data (what each
 * component renders, read from its source) and the stories, never a list; the
 * docs pages' anatomy uses the same.
 */
export const familyOf = async (name: string): Promise<string[]> =>
  familyWith(name, await subcomponentsOf(name))
