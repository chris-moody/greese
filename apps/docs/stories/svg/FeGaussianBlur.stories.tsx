import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeGaussianBlur } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** A Gaussian blur. `deviation` is how far it spreads; `[x, y]` blurs one axis. */
const meta = {
  title: 'SVG/FeGaussianBlur',
  component: FeGaussianBlur,
  args: { deviation: 3 },
  decorators: [filterStage('story-fegaussianblur')],
} satisfies Meta<typeof FeGaussianBlur>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** A blur on one axis: motion blur. */
export const MotionBlur: Story = { args: { deviation: [6, 0] } }
