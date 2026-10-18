import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Menu, MenuItem, MenuSeparator } from '@sauce-ui/react'

const meta = {
  title: 'Overlays/Menu',
  component: Menu,
  subcomponents: { MenuItem, MenuSeparator },
  args: {
    trigger: <Button variant="outline">Actions</Button>,
    children: (
      <>
        <MenuItem>Rename</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem disabled>Move (no permission)</MenuItem>
        <MenuSeparator />
        <MenuItem tone="negative">Delete</MenuItem>
      </>
    ),
  },
  argTypes: {
    placement: {
      control: 'select',
      options: [
        'bottom',
        'bottom-start',
        'bottom-end',
        'top',
        'top-start',
        'top-end',
        'start',
        'end',
      ],
    },
  },
} satisfies Meta<typeof Menu>
export default meta

type Story = StoryObj<typeof meta>

/** Arrow keys, Home/End and type-ahead move focus; Escape returns it to the trigger. */
export const Playground: Story = {}

/** `asChild` turns an item into a link. */
export const WithLinks: Story = {
  args: {
    trigger: <Button variant="outline">Help</Button>,
    children: (
      <>
        <MenuItem asChild>
          <a href="#docs">Documentation</a>
        </MenuItem>
        <MenuItem asChild>
          <a href="#support">Contact support</a>
        </MenuItem>
      </>
    ),
  },
}
