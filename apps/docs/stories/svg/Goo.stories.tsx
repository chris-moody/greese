import type { Meta, StoryObj } from '@storybook/react-vite'
import { Goo } from '@greese/react/svg'
import { blobs, filterStage } from '../_shared/FilterStage.tsx'

/** A filter preset. Shapes that come near each other merge like liquid. */
const meta = {
  title: 'SVG/Goo',
  component: Goo,
  args: { blur: 6, threshold: 20 },
  parameters: { art: blobs },
  decorators: [filterStage('story-goo')],
} satisfies Meta<typeof Goo>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
