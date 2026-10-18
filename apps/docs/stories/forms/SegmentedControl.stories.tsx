import type { Meta, StoryObj } from '@storybook/react-vite'
import { Segment, SegmentedControl } from '@sauce-ui/react'

const meta = {
  title: 'Forms/SegmentedControl',
  component: SegmentedControl,
  subcomponents: { Segment },
  args: {
    label: 'View',
    defaultValue: 'list',
    children: (
      <>
        <Segment value="list">List</Segment>
        <Segment value="grid">Grid</Segment>
        <Segment value="board">Board</Segment>
      </>
    ),
  },
} satisfies Meta<typeof SegmentedControl>
export default meta

type Story = StoryObj<typeof meta>

/** Native radios underneath: arrow keys move the selection. */
export const Playground: Story = {}

export const VisibleLabelSmall: Story = {
  args: {
    label: 'Range',
    hideLabel: false,
    size: 'sm',
    defaultValue: '7d',
    children: (
      <>
        <Segment value="24h">24h</Segment>
        <Segment value="7d">7 days</Segment>
        <Segment value="30d">30 days</Segment>
        <Segment value="all" disabled>
          All time
        </Segment>
      </>
    ),
  },
}

export const FullWidth: Story = { args: { fullWidth: true } }
