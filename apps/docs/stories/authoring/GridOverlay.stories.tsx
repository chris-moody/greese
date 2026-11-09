import type { Meta, StoryObj } from '@storybook/react-vite'
import { GridOverlay } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/GridOverlay',
  component: GridOverlay,
  args: { offsetX: 0, offsetY: 0, scale: 1, interval: 20 },
  argTypes: {
    scale: { control: { type: 'range', min: 0.1, max: 4, step: 0.1 } },
    interval: { control: { type: 'number', min: 1 } },
  },
} satisfies Meta<typeof GridOverlay>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A reference grid over a stage: a line every `interval` stage units from
 * the origin, which sits `offsetX`, `offsetY` from the centre. Zoomed out
 * until its lines would be under 4 pixels apart, it draws nothing.
 */
export const Playground: Story = {
  render: (args) => (
    <div
      style={{
        position: 'relative',
        blockSize: '16rem',
        border: '1px solid var(--greese-color-border)',
      }}
    >
      <GridOverlay {...args} />
    </div>
  ),
}

/** Lines closer than 4 pixels aren't drawn. */
export const TooDense: Story = {
  args: { interval: 2, scale: 1 },
  render: Playground.render,
}
