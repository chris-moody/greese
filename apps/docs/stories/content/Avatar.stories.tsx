import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, Stack } from '@sauce-ui/react'
import { art } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Content/Avatar',
  component: Avatar,
  args: { name: 'Ada Lovelace', size: 'lg' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    shape: { control: 'inline-radio', options: ['circle', 'square'] },
  },
} satisfies Meta<typeof Avatar>
export default meta

type Story = StoryObj<typeof meta>

/** Initials when there is no image. */
export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <Stack direction="row" gap={3} align="center">
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Avatar key={size} name="Ada Lovelace" size={size} />
      ))}
      <Avatar name="Grace Hopper" src={art(320, '1 1')} size="lg" />
      <Avatar name="Broken Image" src="/does-not-exist.png" size="lg" />
      <Avatar name="Square" shape="square" size="lg" />
    </Stack>
  ),
}
