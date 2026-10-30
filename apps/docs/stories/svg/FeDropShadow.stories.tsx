import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeDropShadow } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** A drop shadow in one primitive. */
const meta = {
  title: 'SVG/FeDropShadow',
  component: FeDropShadow,
  args: { x: 3, y: 5, blur: 3, opacity: 0.4 },
  decorators: [filterStage('story-fedropshadow')],
} satisfies Meta<typeof FeDropShadow>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
