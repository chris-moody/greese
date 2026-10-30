import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeFlood } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** Fills the filter region with a color, whatever the input: the start of tints and glows. */
const meta = {
  title: 'SVG/FeFlood',
  component: FeFlood,
  args: { color: 'gold', opacity: 0.6 },
  decorators: [filterStage('story-feflood')],
} satisfies Meta<typeof FeFlood>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
