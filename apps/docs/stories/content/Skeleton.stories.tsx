import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton, Stack } from '@sauce-ui/react'

const meta = {
  title: 'Content/Skeleton',
  component: Skeleton,
  args: { lines: 3 },
  argTypes: { shape: { control: 'inline-radio', options: ['text', 'rect', 'circle'] } },
  decorators: [(Story) => <div style={{ maxInlineSize: '28rem' }}>{Story()}</div>],
} satisfies Meta<typeof Skeleton>
export default meta

type Story = StoryObj<typeof meta>

/** Hidden from screen readers; the shimmer stops under reduced motion. */
export const Text: Story = {}

export const CardPlaceholder: Story = {
  render: () => (
    <Stack gap={3}>
      <Stack direction="row" gap={3} align="center">
        <Skeleton shape="circle" />
        <Skeleton lines={2} />
      </Stack>
      <Skeleton shape="rect" />
    </Stack>
  ),
}
