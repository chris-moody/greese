import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, Badge, Button, List, ListItem } from '@greese-ui/react'

const people = [
  { name: 'Ada Lovelace', role: 'Analyst', status: 'Owner' },
  { name: 'Grace Hopper', role: 'Compiler', status: 'Admin' },
  { name: 'Alan Turing', role: 'Theory', status: 'Member' },
]

const meta = {
  title: 'Content/List',
  component: List,
  subcomponents: { ListItem },
  args: {
    framed: true,
    style: { maxInlineSize: '32rem' },
    children: people.map((p) => (
      <ListItem
        key={p.name}
        start={<Avatar name={p.name} size="sm" />}
        title={p.name}
        description={p.role}
        end={
          <Badge tone={p.status === 'Owner' ? 'primary' : 'neutral'}>{p.status}</Badge>
        }
      />
    )),
  },
} satisfies Meta<typeof List>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Rows with actions, no frame. */
export const WithActions: Story = {
  args: {
    framed: false,
    children: people.map((p) => (
      <ListItem
        key={p.name}
        title={p.name}
        description={p.role}
        end={
          <Button size="sm" variant="soft">
            Message
          </Button>
        }
      />
    )),
  },
}
