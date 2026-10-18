import type { Meta, StoryObj } from '@storybook/react-vite'
import { Progress } from '@greese-ui/react'

const meta = {
  title: 'Content/Progress',
  component: Progress,
  args: { 'aria-label': 'Upload', value: 64 },
  decorators: [(Story) => <div style={{ maxInlineSize: '24rem' }}>{Story()}</div>],
} satisfies Meta<typeof Progress>
export default meta

type Story = StoryObj<typeof meta>

/** A native progress bar, announced with its percentage. */
export const Determinate: Story = {}

/** No `value`: an indeterminate sweep. */
export const Indeterminate: Story = {
  args: { value: undefined, 'aria-label': 'Processing' },
}

export const Small: Story = { args: { size: 'sm' } }
