import type { Meta, StoryObj } from '@storybook/react-vite'
import { Countdown, Stack, Text } from '@greese/react'

const meta = {
  title: 'Content/Countdown',
  component: Countdown,
  // Paused here so the docs and screenshots don't change; press play in Controls.
  args: { seconds: 3725, running: false },
  argTypes: {
    format: { control: 'inline-radio', options: ['clock', 'labels'] },
  },
} satisfies Meta<typeof Countdown>
export default meta

type Story = StoryObj<typeof meta>

/** Set `running` to watch it count. */
export const Playground: Story = {}

export const DaysWithLabels: Story = {
  args: {
    seconds: 3 * 86400 + 4 * 3600 + 5 * 60 + 6,
    units: ['days', 'hours', 'minutes', 'seconds'],
    format: 'labels',
  },
}

export const Large: Story = {
  render: (args) => (
    <Stack gap={1}>
      <Text size="sm" tone="muted">
        Sale ends in
      </Text>
      <Text size="4xl" weight="bold">
        <Countdown {...args} />
      </Text>
    </Stack>
  ),
}
