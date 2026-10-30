import type { Meta, StoryObj } from '@storybook/react-vite'
import { Distort } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** A filter preset. Wobbly, hand-drawn edges from noise. */
const meta = {
  title: 'SVG/Distort',
  component: Distort,
  args: { frequency: 0.04, scale: 6, seed: 2 },
  decorators: [filterStage('story-distort')],
} satisfies Meta<typeof Distort>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
