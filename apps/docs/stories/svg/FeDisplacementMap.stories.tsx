import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeDisplacementMap, FeTurbulence } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** Moves the shape's pixels by noise: wobbly edges. */
const meta = {
  title: 'SVG/FeDisplacementMap',
  component: FeDisplacementMap,
  args: { in: 'SourceGraphic', in2: 'noise', scale: 8, xChannel: 'R', yChannel: 'G' },
  // What it combines comes first in the filter.
  render: (args) => (
    <>
      <FeTurbulence frequency={0.04} octaves={2} seed={2} result="noise" />
      <FeDisplacementMap {...args} />
    </>
  ),
  decorators: [filterStage('story-fedisplacementmap')],
} satisfies Meta<typeof FeDisplacementMap>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
