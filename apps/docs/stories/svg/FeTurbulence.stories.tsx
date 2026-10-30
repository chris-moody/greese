import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeTurbulence } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** Perlin noise, painted over the region: on its own, a texture; with others, grain and wobble. */
const meta = {
  title: 'SVG/FeTurbulence',
  component: FeTurbulence,
  args: { type: 'fractalNoise', frequency: 0.05, octaves: 3, seed: 2 },
  decorators: [filterStage('story-feturbulence')],
} satisfies Meta<typeof FeTurbulence>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
