import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Menu, MenuItem } from '@greese-ui/react'

/** One action in a Menu. Open the menu to see it; `asChild` makes it a link. */
const meta = {
  title: 'Overlays/MenuItem',
  component: MenuItem,
  args: { children: 'Rename' },
  argTypes: { tone: { control: 'inline-radio', options: ['neutral', 'negative'] } },
  decorators: [
    (Story) => (
      <Menu trigger={<Button variant="outline">Actions</Button>}>
        <Story />
        <MenuItem>Duplicate</MenuItem>
      </Menu>
    ),
  ],
} satisfies Meta<typeof MenuItem>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Negative: Story = { args: { tone: 'negative', children: 'Delete' } }
