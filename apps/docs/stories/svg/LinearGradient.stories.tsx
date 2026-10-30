import type { Meta, StoryObj } from '@storybook/react-vite'
import { Drawing, LinearGradient, Path, url } from '@greese/react/svg'

const meta = {
  title: 'SVG/LinearGradient',
  component: LinearGradient,
  args: { id: 'linear-demo', angle: 135, stops: ['#38bdf8', '#6366f1', '#ec4899'] },
  argTypes: {
    angle: { control: { type: 'range', min: 0, max: 360, step: 5 } },
    spread: { control: 'inline-radio', options: ['pad', 'reflect', 'repeat'] },
  },
  decorators: [
    (Story, { args }) => (
      <Drawing viewBox="0 0 100 100" width={180} height={180}>
        <defs>
          <Story />
        </defs>
        <Path
          d={{ type: 'rect', x: 4, y: 4, width: 92, height: 92, rx: 16 }}
          fill={url(args.id)}
        />
      </Drawing>
    ),
  ],
} satisfies Meta<typeof LinearGradient>
export default meta

type Story = StoryObj<typeof meta>

/** Three colors at 135°, spaced evenly. `angle` reads as in CSS. */
export const Playground: Story = {}

/** Stops can say where they sit, and how opaque they are. */
export const PlacedStops: Story = {
  args: {
    id: 'linear-placed',
    angle: 90,
    stops: [
      { color: '#f97316', offset: 0 },
      { color: '#f97316', offset: 40 },
      { color: '#facc15', offset: 60, opacity: 0.4 },
    ],
  },
}
