import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeColorMatrix } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** Transforms colors: a matrix, or a saturation, hue turn or luminance to alpha. */
const meta = {
  title: 'SVG/FeColorMatrix',
  component: FeColorMatrix,
  args: { type: 'hueRotate', values: 120 },
  decorators: [filterStage('story-fecolormatrix')],
} satisfies Meta<typeof FeColorMatrix>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** No saturation: gray. */
export const Gray: Story = { args: { type: 'saturate', values: 0 } }
