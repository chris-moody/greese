import type { Meta, StoryObj } from '@storybook/react-vite'
import { VisuallyHidden } from '@greese/react'

const meta = {
  title: 'Utilities/VisuallyHidden',
  component: VisuallyHidden,
  args: { children: 'Close dialog' },
} satisfies Meta<typeof VisuallyHidden>

export default meta

/** The hidden text names an icon-only button: screen readers say "Close dialog". */
export const Playground: StoryObj<typeof meta> = {
  render: (args) => (
    <button type="button">
      <span aria-hidden="true">×</span>
      <VisuallyHidden {...args} />
    </button>
  ),
}

export const IconButtonLabel: StoryObj<typeof meta> = {
  render: () => (
    <button type="button">
      <span aria-hidden="true">×</span>
      <VisuallyHidden>Close dialog</VisuallyHidden>
    </button>
  ),
}
