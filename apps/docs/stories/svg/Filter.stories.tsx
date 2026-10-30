import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Distort,
  Drawing,
  FeDropShadow,
  FeGaussianBlur,
  Filter,
  Glow,
  Goo,
  Grain,
  Path,
  url,
} from '@greese/react/svg'
import { blobs } from '../_shared/FilterStage.tsx'

const meta = {
  title: 'SVG/Filter',
  component: Filter,
  args: {
    id: 'filter-demo',
    children: <Glow color="#facc15" blur={5} strength={2} />,
    x: '-50%',
    y: '-50%',
    width: '200%',
    height: '200%',
  },
  decorators: [
    (Story, { args, parameters }) => (
      <Drawing viewBox="0 0 120 120" width={200} height={200}>
        <defs>
          <Story />
        </defs>
        {/* What the filter is applied to: a star, or a story's own art. */}
        <g filter={url(args.id)}>
          {parameters.art ?? (
            <Path
              d={{ type: 'star', cx: 60, cy: 62, r: 40, innerRadius: 18 }}
              style={{ fill: 'var(--greese-color-primary)' }}
            />
          )}
        </g>
      </Drawing>
    ),
  ],
} satisfies Meta<typeof Filter>
export default meta

type Story = StoryObj<typeof meta>

/** The `Glow` preset, with a region large enough for it. */
export const Playground: Story = {}

/** One primitive: a drop shadow. */
export const Shadow: Story = {
  args: {
    id: 'filter-shadow',
    children: <FeDropShadow x={3} y={5} blur={3} opacity={0.4} />,
  },
}

/** A blur on one axis: motion blur. */
export const MotionBlur: Story = {
  args: { id: 'filter-blur', children: <FeGaussianBlur deviation={[6, 0]} /> },
}

/** Wobbly, hand-drawn edges from noise. */
export const Wobble: Story = {
  args: {
    id: 'filter-distort',
    children: <Distort frequency={0.04} scale={6} seed={2} />,
  },
}

/** Film grain inside the shape. */
export const FilmGrain: Story = {
  args: { id: 'filter-grain', children: <Grain opacity={0.35} seed={4} /> },
}

/** Goo merges shapes that come near each other, like liquid. */
export const Liquid: Story = {
  args: { id: 'filter-goo', children: <Goo blur={6} threshold={20} /> },
  parameters: { art: blobs },
}

/** Primitives in order: a glow, then the shape blurred on top of it. */
export const Composed: Story = {
  args: {
    id: 'filter-composed',
    children: (
      <>
        <Glow color="#38bdf8" blur={4} />
        <FeGaussianBlur deviation={0.6} />
      </>
    ),
  },
}
