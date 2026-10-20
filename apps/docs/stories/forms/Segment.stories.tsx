import type { Meta, StoryObj } from '@storybook/react-vite'
import { Segment, SegmentedControl } from '@greese/react'

/** One option of a SegmentedControl: a native radio underneath. */
const meta = {
  title: 'Forms/Segment',
  component: Segment,
  args: { value: 'grid', children: 'Grid' },
  decorators: [
    (Story) => (
      <SegmentedControl label="View" defaultValue="list">
        <Segment value="list">List</Segment>
        <Story />
        <Segment value="board">Board</Segment>
      </SegmentedControl>
    ),
  ],
} satisfies Meta<typeof Segment>
export default meta

type Story = StoryObj<typeof meta>

/** The middle segment; List is selected. */
export const Playground: Story = {}

export const Disabled: Story = {
  args: { value: 'table', children: 'Table', disabled: true },
}
