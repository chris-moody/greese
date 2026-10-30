import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeBlend, FeTurbulence } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** Blends two inputs with a blend mode: noise multiplied into the shape. */
const meta = {
  title: 'SVG/FeBlend',
  component: FeBlend,
  args: { in: 'SourceGraphic', in2: 'noise', mode: 'multiply' },
  // What it combines comes first in the filter.
  render: (args) => (
    <>
      <FeTurbulence type="fractalNoise" frequency={0.08} seed={3} result="noise" />
      <FeBlend {...args} />
    </>
  ),
  decorators: [filterStage('story-feblend')],
} satisfies Meta<typeof FeBlend>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
