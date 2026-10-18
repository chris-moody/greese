import type { Meta, StoryObj } from '@storybook/react-vite'
import { VisuallyHidden } from '@greese-ui/react'

const meta = {
  title: 'Utilities/VisuallyHidden',
  component: VisuallyHidden,
} satisfies Meta<typeof VisuallyHidden>

export default meta

export const IconButtonLabel: StoryObj<typeof meta> = {
  render: () => (
    <button type="button">
      <span aria-hidden="true">×</span>
      <VisuallyHidden>Close dialog</VisuallyHidden>
    </button>
  ),
}
