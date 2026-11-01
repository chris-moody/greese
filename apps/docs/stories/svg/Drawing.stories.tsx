import type { Meta, StoryObj } from '@storybook/react-vite'
import { Drawing, Path } from '@greese/react/svg'
import { Replay } from '../_shared/Replay.tsx'

const meta = {
  title: 'SVG/Drawing',
  component: Drawing,
  args: {
    label: 'A star',
    viewBox: '0 0 100 100',
    width: 160,
    height: 160,
    children: (
      <Path
        d={{ type: 'star', cx: 50, cy: 50, r: 44, innerRadius: 20 }}
        className="fill-primary"
      />
    ),
  },
} satisfies Meta<typeof Drawing>
export default meta

type Story = StoryObj<typeof meta>

/** With a `label`, the drawing is an image named by it. */
export const Playground: Story = {}

/** Without one it's decorative: hidden from screen readers. */
export const Decorative: Story = { args: { label: undefined } }

/** It takes the `greese` prop like every component. */
export const WithMotion: Story = {
  args: { greese: 'scaleIn' },
  decorators: [(Story) => <Replay>{Story()}</Replay>],
}
