import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Menu, MenuItem, MenuSeparator } from '@greese/react'

/** A divider between groups of menu items. Open the menu to see it. */
const meta = {
  title: 'Overlays/MenuSeparator',
  component: MenuSeparator,
  decorators: [
    (Story) => (
      <Menu trigger={<Button variant="outline">Actions</Button>}>
        <MenuItem>Rename</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <Story />
        <MenuItem tone="negative">Delete</MenuItem>
      </Menu>
    ),
  ],
} satisfies Meta<typeof MenuSeparator>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
