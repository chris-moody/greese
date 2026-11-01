import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button, Slider, Stack } from '@greese/react'
import { Drawing, Morph, type ShapeSpec } from '@greese/react/svg'
import { Replay } from '../_shared/Replay.tsx'

const shapes: ShapeSpec[] = [
  { type: 'star', cx: 50, cy: 50, r: 44, innerRadius: 20 },
  { type: 'circle', cx: 50, cy: 50, r: 40 },
  { type: 'rect', x: 12, y: 12, width: 76, height: 76, rx: 10 },
  { type: 'regularPolygon', cx: 50, cy: 54, r: 44, sides: 3 },
]

const meta = {
  title: 'SVG/Morph',
  component: Morph,
  args: { shapes, from: 3, index: 0, duration: 0.6, className: 'fill-primary' },
  argTypes: {
    index: { control: 'inline-radio', options: [0, 1, 2, 3] },
    from: { control: 'inline-radio', options: [0, 1, 2, 3] },
    ease: { control: 'inline-radio', options: ['linear', 'in', 'out', 'inOut'] },
  },
  decorators: [
    // Stories with controls draw their own Drawing (`parameters.ownDrawing`).
    // Each morphs in from `from` as it mounts, so Replay remounts it; a scrub
    // has no animation of its own (`parameters.replay: false`).
    (Story, { parameters }) => {
      const story = parameters.ownDrawing ? (
        <Story />
      ) : (
        <Drawing viewBox="0 0 100 100" width={180} height={180}>
          <Story />
        </Drawing>
      )
      return parameters.replay === false ? story : <Replay align="center">{story}</Replay>
    },
  ],
} satisfies Meta<typeof Morph>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Pick an `index` and it morphs there: a star, a circle, a rounded square, a
 * triangle. `from` is the shape it morphs in from when it mounts.
 */
export const Playground: Story = {}

/** Click through the shapes, mid-morph too: it carries on from where it is. */
export const Cycle: Story = {
  parameters: { ownDrawing: true },
  render: function Render(args) {
    const [index, setIndex] = useState(0)
    return (
      <Stack gap={3} align="center">
        <Drawing viewBox="0 0 100 100" width={180} height={180}>
          <Morph {...args} index={index} />
        </Drawing>
        <Button size="sm" onClick={() => setIndex((i) => (i + 1) % shapes.length)}>
          Next shape
        </Button>
      </Stack>
    )
  },
}

/** `progress` scrubs through every shape in turn, with no animation of its own. */
export const Scrub: Story = {
  parameters: { ownDrawing: true, replay: false },
  render: function Render(args) {
    const [progress, setProgress] = useState(0.5)
    return (
      <Stack gap={3} align="center">
        <Drawing viewBox="0 0 100 100" width={180} height={180}>
          <Morph {...args} progress={progress} />
        </Drawing>
        <Slider
          aria-label="Progress"
          value={progress}
          onValueChange={setProgress}
          min={0}
          max={shapes.length - 1}
          step={0.01}
        />
      </Stack>
    )
  },
}

/** One shape into two: the missing part grows from its partner's center. */
export const SplitInTwo: Story = {
  args: {
    shapes: [
      'M30 50a20 20 0 1 0 40 0a20 20 0 1 0-40 0Z',
      'M8 50a16 16 0 1 0 32 0a16 16 0 1 0-32 0ZM60 50a16 16 0 1 0 32 0a16 16 0 1 0-32 0Z',
    ],
    from: 0,
    index: 1,
  },
}
