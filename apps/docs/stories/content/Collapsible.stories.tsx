import type { Meta, StoryObj } from '@storybook/react-vite'
import { Collapsible, Text } from '@greese-ui/react'

const meta = {
  title: 'Content/Collapsible',
  component: Collapsible,
  args: {
    title: 'Show advanced options',
    style: { maxInlineSize: '36rem' },
    children: <Text>Advanced options live here.</Text>,
  },
} satisfies Meta<typeof Collapsible>
export default meta

type Story = StoryObj<typeof meta>

/** A single native details/summary disclosure. */
export const Playground: Story = {}

export const OpenByDefault: Story = { args: { defaultOpen: true } }
