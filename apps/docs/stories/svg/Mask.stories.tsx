import type { Meta, StoryObj } from '@storybook/react-vite'
import { Drawing, LinearGradient, Mask, url } from '@greese/react/svg'

const meta = {
  title: 'SVG/Mask',
  component: Mask,
  args: {
    id: 'mask-demo',
    content: [{ type: 'star', cx: 50, cy: 52, r: 46, innerRadius: 22 }],
  },
  decorators: [
    (Story, { args }) => (
      <Drawing viewBox="0 0 100 100" width={180} height={180}>
        <defs>
          <Story />
          <LinearGradient id="mask-paint" angle={45} stops={['#f97316', '#db2777']} />
        </defs>
        <rect width={100} height={100} fill={url('mask-paint')} mask={url(args.id)} />
      </Drawing>
    ),
  ],
} satisfies Meta<typeof Mask>
export default meta

type Story = StoryObj<typeof meta>

/** Shapes in a mask are filled white: they reveal what's masked. */
export const Playground: Story = {}

/** A gradient in the mask fades the picture out. */
export const Fade: Story = {
  args: {
    id: 'mask-fade',
    content: [],
    children: (
      <>
        <LinearGradient id="mask-fade-ramp" angle={90} stops={['white', 'black']} />
        <rect width={100} height={100} fill={url('mask-fade-ramp')} />
      </>
    ),
  },
}
