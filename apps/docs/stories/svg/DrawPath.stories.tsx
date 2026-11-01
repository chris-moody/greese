import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button, Stack } from '@greese/react'
import { Drawing, DrawPath } from '@greese/react/svg'
import { Replay } from '../_shared/Replay.tsx'

const signature =
  'M8 70C20 30 32 20 38 34S30 80 44 66 62 20 70 34 66 72 80 60 92 40 96 44'

// The theme's colors as utility classes; the rest as SVG attributes.
const stroke = {
  className: 'fill-none stroke-primary',
  strokeWidth: 4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const meta = {
  title: 'SVG/DrawPath',
  component: DrawPath,
  args: { d: signature, duration: 1.6, easing: 'ease-in-out', ...stroke },
  argTypes: { paused: { control: 'boolean' }, alternate: { control: 'boolean' } },
  decorators: [
    // Stories with controls draw their own Drawing (`parameters.ownDrawing`).
    // Each draws on as it mounts, so Replay remounts it; a loop never stops,
    // so it has nothing to replay (`parameters.replay: false`).
    (Story, { parameters }) => {
      const story = parameters.ownDrawing ? (
        <Story />
      ) : (
        <Drawing viewBox="0 0 104 100" width={240} height={230}>
          <Story />
        </Drawing>
      )
      return parameters.replay === false ? story : <Replay align="center">{story}</Replay>
    },
  ],
} satisfies Meta<typeof DrawPath>
export default meta

type Story = StoryObj<typeof meta>

/** Draws itself on when it mounts. Under reduced motion it's simply drawn. */
export const Playground: Story = {}

/**
 * Change `to` and the stroke moves on from where it is: fill it from the
 * start, drain it toward the end, or pick a middle slice. Click during a
 * play to see it carry on rather than jump.
 */
export const FillAndDrain: Story = {
  parameters: { ownDrawing: true },
  render: function Render(args) {
    const [to, setTo] = useState({ start: 0, end: 100 })
    return (
      <Stack gap={3} align="center">
        <Drawing viewBox="0 0 104 100" width={240} height={230}>
          <DrawPath {...args} to={to} />
        </Drawing>
        <Stack direction="row" gap={2} wrap="wrap">
          <Button size="sm" onClick={() => setTo({ start: 0, end: 100 })}>
            Fill
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTo({ start: 100, end: 100 })}
          >
            Drain
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTo({ start: 35, end: 65 })}
          >
            Middle
          </Button>
        </Stack>
      </Stack>
    )
  },
}

/** A loading line: draws on and off again, forever. */
export const Loop: Story = {
  parameters: { replay: false },
  args: {
    d: { type: 'circle', cx: 52, cy: 50, r: 36 },
    from: { start: 0, end: 0 },
    to: { start: 0, end: 100 },
    repeat: -1,
    alternate: true,
  },
}
