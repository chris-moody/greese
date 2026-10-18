import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spinner, Stack } from '@sauce-ui/react'

const meta = {
  title: 'Content/Spinner',
  component: Spinner,
  args: { label: 'Loading results' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Spinner>
export default meta

type Story = StoryObj<typeof meta>

/** Announced as a status; pulses instead of spinning under reduced motion. */
export const Playground: Story = {}

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" gap={4} align="center">
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </Stack>
  ),
}
