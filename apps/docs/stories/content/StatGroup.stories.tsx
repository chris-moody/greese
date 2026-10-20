import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stat, StatGroup } from '@greese/react'

/** Stats side by side with dividers, stacked on narrow screens. */
const meta = {
  title: 'Content/StatGroup',
  component: StatGroup,
  args: {
    children: (
      <>
        <Stat label="Revenue" value="$48,200" description="up 12%" tone="positive" />
        <Stat label="Orders" value="1,204" description="up 3%" tone="positive" />
        <Stat
          label="Refunds"
          value="18"
          description="up 2 on last month"
          tone="negative"
        />
      </>
    ),
  },
  argTypes: { rowFrom: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] } },
} satisfies Meta<typeof StatGroup>
export default meta

type Story = StoryObj<typeof meta>

/** Stacked on phones, a row from sm. */
export const Playground: Story = {}
