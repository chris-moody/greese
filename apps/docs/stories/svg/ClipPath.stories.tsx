import type { Meta, StoryObj } from '@storybook/react-vite'
import { ClipPath, Drawing, LinearGradient, url } from '@greese/react/svg'

const meta = {
  title: 'SVG/ClipPath',
  component: ClipPath,
  args: {
    id: 'clip-demo',
    content: [{ type: 'regularPolygon', cx: 50, cy: 50, r: 48, sides: 6, rotation: 30 }],
  },
  decorators: [
    (Story, { args }) => (
      <Drawing viewBox="0 0 100 100" width={180} height={180}>
        <defs>
          <Story />
          <LinearGradient id="clip-paint" angle={160} stops={['#22d3ee', '#a855f7']} />
        </defs>
        <rect width={100} height={100} fill={url('clip-paint')} clipPath={url(args.id)} />
      </Drawing>
    ),
  ],
} satisfies Meta<typeof ClipPath>
export default meta

type Story = StoryObj<typeof meta>

/** A square of gradient, clipped to a hexagon. */
export const Playground: Story = {}

/** Several shapes clip together: what's inside any of them shows. */
export const SeveralShapes: Story = {
  args: {
    id: 'clip-several',
    content: [
      { type: 'circle', cx: 30, cy: 30, r: 24 },
      { type: 'star', cx: 66, cy: 66, r: 32, innerRadius: 14 },
    ],
  },
}
