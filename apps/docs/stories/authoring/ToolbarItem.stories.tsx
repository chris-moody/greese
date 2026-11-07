import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { CircleIcon, RectangleIcon, StarIcon } from '@greese/icons'
import { Toolbar, ToolbarItem, type ToolDefinition } from '@greese/authoring'
import '@greese/authoring/styles.css'

/** A group: one button for the last of its tools used, the rest in a flyout. */
const shapes: ToolDefinition = {
  id: 'shapes',
  label: 'Shapes',
  icon: <RectangleIcon />,
  subTools: [
    { id: 'rect', label: 'Rectangle', hotkey: 'r', icon: <RectangleIcon /> },
    { id: 'ellipse', label: 'Ellipse', hotkey: 'e', icon: <CircleIcon /> },
  ],
}

const star: ToolDefinition = {
  id: 'star',
  label: 'Star',
  hotkey: 's',
  icon: <StarIcon />,
}

const meta = {
  title: 'Authoring/ToolbarItem',
  component: ToolbarItem,
  args: { tool: shapes, value: 'rect', onSelect: () => undefined },
  argTypes: {
    tool: { control: false },
    value: { control: false },
    onSelect: { control: false },
  },
  decorators: [
    (Story) => (
      <Toolbar tools={[]} value="" onValueChange={() => undefined}>
        <Story />
      </Toolbar>
    ),
  ],
} satisfies Meta<typeof ToolbarItem>
export default meta

type Story = StoryObj<typeof meta>

/**
 * One of a Toolbar's buttons. A plain tool's button picks it; a group's picks
 * its last-used tool, and its corner arrow opens the others.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [tool, setTool] = useState('rect')
    return (
      <>
        <ToolbarItem {...args} value={tool} onSelect={setTool} />
        <ToolbarItem {...args} tool={star} value={tool} onSelect={setTool} />
      </>
    )
  },
}
