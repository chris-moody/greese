import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Grid, Slider, Stack, Text } from '@greese/react'
import { Drawing, Path, type ShapeSpec, type Slice } from '@greese/react/svg'

const stroke = {
  fill: 'none',
  stroke: 'var(--greese-color-primary)',
  strokeWidth: 6,
  strokeLinecap: 'round',
} as const

const meta = {
  title: 'SVG/Path',
  component: Path,
  args: {
    d: { type: 'circle', cx: 50, cy: 50, r: 40 },
    slice: { end: 70 },
    style: stroke,
  },
  decorators: [
    // Stories with controls draw their own Drawing (`parameters.ownDrawing`).
    (Story, { parameters }) =>
      parameters.ownDrawing ? (
        <Story />
      ) : (
        <Drawing viewBox="0 0 100 100" width={160} height={160}>
          <Story />
        </Drawing>
      ),
  ],
} satisfies Meta<typeof Path>
export default meta

type Story = StoryObj<typeof meta>

/** A shape spec drawn as a path, its stroke sliced to 70%. */
export const Playground: Story = {}

const shapes: Array<[string, ShapeSpec]> = [
  ['circle', { type: 'circle', cx: 50, cy: 50, r: 40 }],
  ['ellipse', { type: 'ellipse', cx: 50, cy: 50, rx: 44, ry: 28 }],
  ['rect', { type: 'rect', x: 10, y: 20, width: 80, height: 60, rx: 12 }],
  ['regularPolygon', { type: 'regularPolygon', cx: 50, cy: 52, r: 42, sides: 6 }],
  ['star', { type: 'star', cx: 50, cy: 52, r: 44, innerRadius: 20, points: 5 }],
  [
    'arc (pie)',
    { type: 'arc', cx: 50, cy: 50, r: 40, start: 30, length: 300, close: 'pie' },
  ],
]

/** Every shape spec `d` takes, filled. */
export const Shapes: Story = {
  parameters: { ownDrawing: true },
  render: () => (
    <Grid minChildWidth="7rem" gap={3}>
      {shapes.map(([name, d]) => (
        <Stack key={name} gap={1} align="center">
          <Drawing viewBox="0 0 100 100" width={96} height={96}>
            <Path d={d} style={{ fill: 'var(--greese-color-primary)' }} />
          </Drawing>
          <Text variant="caption">{name}</Text>
        </Stack>
      ))}
    </Grid>
  ),
}

const slices: Array<[string, Slice]> = [
  ['{ end: 40 }', { end: 40 }],
  ['{ start: 30, end: 70 }', { start: 30, end: 70 }],
  ['{ end: 30, offset: 85 } wraps', { end: 30, offset: 85 }],
  ['{ end: 6, repeat: 8 }', { end: 6, repeat: 8 }],
]

/** Slices of the same circle: a part, a middle, one that wraps past the start, and a marquee's dashes. */
export const Slices: Story = {
  parameters: { ownDrawing: true },
  render: () => (
    <Grid minChildWidth="9rem" gap={3}>
      {slices.map(([name, slice]) => (
        <Stack key={name} gap={1} align="center">
          <Drawing viewBox="0 0 100 100" width={110} height={110}>
            <Path
              d={{ type: 'circle', cx: 50, cy: 50, r: 40 }}
              slice={slice}
              style={stroke}
            />
          </Drawing>
          <Text variant="caption">
            <code>{name}</code>
          </Text>
        </Stack>
      ))}
    </Grid>
  ),
}

/**
 * A slice is two CSS properties, so a CSS `transition` animates it as it
 * changes: drag to fill and drain the stroke.
 */
export const Transition: Story = {
  parameters: { ownDrawing: true },
  render: function Render() {
    const [end, setEnd] = useState(60)
    return (
      <Stack gap={3} align="center">
        <Drawing viewBox="0 0 100 100" width={160} height={160}>
          <Path
            d={{ type: 'rect', x: 10, y: 10, width: 80, height: 80, rx: 16 }}
            slice={{ end }}
            style={{
              ...stroke,
              transition:
                'stroke-dasharray 0.4s ease-out, stroke-dashoffset 0.4s ease-out',
            }}
          />
        </Drawing>
        <Slider aria-label="Drawn" value={end} onValueChange={setEnd} min={0} max={100} />
      </Stack>
    )
  },
}
