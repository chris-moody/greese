import type { Meta, StoryObj } from '@storybook/react-vite'
import { Drawing, Path, RadialGradient, url } from '@greese/react/svg'

const meta = {
  title: 'SVG/RadialGradient',
  component: RadialGradient,
  args: {
    id: 'radial-demo',
    fx: '32%',
    fy: '30%',
    stops: ['#ffffff', { color: '#6366f1', offset: 70 }, '#1e1b4b'],
  },
  argTypes: {
    spread: { control: 'inline-radio', options: ['pad', 'reflect', 'repeat'] },
  },
  decorators: [
    (Story, { args }) => (
      <Drawing viewBox="0 0 100 100" width={180} height={180}>
        <defs>
          <Story />
        </defs>
        <Path d={{ type: 'circle', cx: 50, cy: 50, r: 46 }} fill={url(args.id)} />
      </Drawing>
    ),
  ],
} satisfies Meta<typeof RadialGradient>
export default meta

type Story = StoryObj<typeof meta>

/** A focal point off-center makes a sphere's highlight. */
export const Playground: Story = {}

/** Repeated rings: a small radius with `spread="repeat"`. */
export const Rings: Story = {
  args: {
    id: 'radial-rings',
    r: '18%',
    spread: 'repeat',
    fx: undefined,
    fy: undefined,
    stops: ['#38bdf8', '#0f172a'],
  },
}
