import type { Meta, StoryObj } from '@storybook/react-vite'
import { Glow } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** A filter preset. A soft glow in a color, behind the shape. */
const meta = {
  title: 'SVG/Glow',
  component: Glow,
  args: { color: '#facc15', blur: 5, strength: 2 },
  decorators: [filterStage('story-glow')],
} satisfies Meta<typeof Glow>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
