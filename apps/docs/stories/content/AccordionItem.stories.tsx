import type { Meta, StoryObj } from '@storybook/react-vite'
import { Accordion, AccordionItem } from '@greese-ui/react'

/** One item of an Accordion: a Collapsible that shares the group's name. */
const meta = {
  title: 'Content/AccordionItem',
  component: AccordionItem,
  args: {
    title: 'How long does shipping take?',
    defaultOpen: true,
    children: 'Two to four business days within the country.',
  },
  decorators: [
    (Story) => (
      <Accordion style={{ maxInlineSize: '36rem' }}>
        <Story />
        <AccordionItem title="Can I return an item?">
          Yes, within 30 days, in its original condition.
        </AccordionItem>
      </Accordion>
    ),
  ],
} satisfies Meta<typeof AccordionItem>
export default meta

type Story = StoryObj<typeof meta>

/** The first item; the second is there for context. */
export const Playground: Story = {}

export const Closed: Story = { args: { defaultOpen: false } }
