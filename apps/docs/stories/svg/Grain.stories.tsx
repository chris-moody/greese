import type { Meta, StoryObj } from '@storybook/react-vite'
import { Grain } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** A filter preset. Film grain inside the shape. */
const meta = {
  title: 'SVG/Grain',
  component: Grain,
  args: { opacity: 0.35, seed: 4 },
  decorators: [filterStage('story-grain')],
} satisfies Meta<typeof Grain>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
