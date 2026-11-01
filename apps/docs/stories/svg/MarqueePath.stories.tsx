import type { Meta, StoryObj } from '@storybook/react-vite'
import { Drawing, MarqueePath } from '@greese/react/svg'

const meta = {
  title: 'SVG/MarqueePath',
  component: MarqueePath,
  args: {
    d: { type: 'rect', x: 6, y: 6, width: 188, height: 88, rx: 18 },
    count: 8,
    size: 5,
    duration: 1.5,
    className: 'fill-none stroke-accent',
    strokeWidth: 5,
    strokeLinecap: 'round',
  },
  argTypes: { reverse: { control: 'boolean' }, paused: { control: 'boolean' } },
  decorators: [
    (Story) => (
      <Drawing viewBox="0 0 200 100" width={300} height={150}>
        <Story />
      </Drawing>
    ),
  ],
} satisfies Meta<typeof MarqueePath>
export default meta

type Story = StoryObj<typeof meta>

/** Eight dashes chase round a rounded rectangle. Still under reduced motion. */
export const Playground: Story = {}

/** One long dash: a comet circling. */
export const Comet: Story = {
  args: {
    d: { type: 'circle', cx: 100, cy: 50, r: 40 },
    count: 1,
    size: 30,
    duration: 1.2,
  },
}
