import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Accordion, AccordionItem } from '@greese/react'
import { ChevronRightIcon, MinusIcon, PlusIcon } from '@greese/icons'

const meta = {
  title: 'Content/Accordion',
  component: Accordion,
  subcomponents: { AccordionItem },
  args: {
    exclusive: true,
    style: { maxInlineSize: '36rem' },
    children: (
      <>
        <AccordionItem title="How long does shipping take?" defaultOpen>
          Two to four business days within the country.
        </AccordionItem>
        <AccordionItem title="Can I return an item?">
          Yes, within 30 days, in its original condition.
        </AccordionItem>
        <AccordionItem title="Do you ship internationally?">
          To most countries.
        </AccordionItem>
      </>
    ),
  },
} satisfies Meta<typeof Accordion>
export default meta

type Story = StoryObj<typeof meta>

/** Native `<details name>`: opening one closes the others, with no JavaScript. */
export const Exclusive: Story = {}

export const Independent: Story = { args: { exclusive: false } }

/** An icon per state: a plus that crossfades to a minus as each item opens. */
export const PlusAndMinus: Story = {
  args: { icon: <PlusIcon />, openIcon: <MinusIcon /> },
}

/** One icon of your own that turns: here a chevron pointing on, turned a quarter to point down. */
export const OwnIcon: Story = {
  args: {
    icon: <ChevronRightIcon />,
    iconTransition: 'rotate',
    style: {
      maxInlineSize: '36rem',
      '--greese-collapsible-icon-turn': '90deg',
    } as CSSProperties,
  },
}
