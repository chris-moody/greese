import type { Meta, StoryObj } from '@storybook/react-vite'
import { Progress } from '@greese/react'

const meta = {
  title: 'Content/Progress',
  component: Progress,
  args: { 'aria-label': 'Upload', value: 64 },
  decorators: [(Story) => <div style={{ maxInlineSize: '24rem' }}>{Story()}</div>],
} satisfies Meta<typeof Progress>
export default meta

type Story = StoryObj<typeof meta>

/** A native progress bar, announced with its percentage. */
export const Playground: Story = {}

/** No `value`: an indeterminate sweep. */
export const Indeterminate: Story = {
  args: { value: undefined, 'aria-label': 'Processing' },
}

/**
 * `loading`: a value that's still being worked on. The filled part runs with
 * stripes in the bar's two colors (they hold still under reduced motion), and
 * the bar is `aria-busy`.
 */
export const Loading: Story = { args: { loading: true, size: 'lg' } }

export const Small: Story = { args: { size: 'sm' } }
