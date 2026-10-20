import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, Button, List, ListItem } from '@greese/react'

/** One row of a List: media, a title and description, and actions. */
const meta = {
  title: 'Content/ListItem',
  component: ListItem,
  args: {
    start: <Avatar name="Grace Hopper" size="sm" />,
    title: 'Grace Hopper',
    description: 'Compiler',
    end: (
      <Button size="sm" variant="soft">
        Message
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <List framed style={{ maxInlineSize: '32rem' }}>
        <ListItem title="Ada Lovelace" description="Analyst" />
        <Story />
      </List>
    ),
  ],
} satisfies Meta<typeof ListItem>
export default meta

type Story = StoryObj<typeof meta>

/** The second row. */
export const Playground: Story = {}
