import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, AvatarGroup } from '@greese/react'

const meta = {
  title: 'Content/AvatarGroup',
  component: AvatarGroup,
  args: {
    'aria-label': 'Shared with',
    max: 3,
    children: [
      'Ada Lovelace',
      'Grace Hopper',
      'Alan Turing',
      'Katherine Johnson',
      'Edsger Dijkstra',
    ].map((name) => <Avatar key={name} name={name} />),
  },
} satisfies Meta<typeof AvatarGroup>
export default meta

type Story = StoryObj<typeof meta>

/** Overlapping avatars with a "+N" count beyond `max`. */
export const Playground: Story = {}

export const Large: Story = { args: { size: 'lg', max: 4 } }
