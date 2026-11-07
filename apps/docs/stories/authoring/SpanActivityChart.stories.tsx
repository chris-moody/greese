import type { Meta, StoryObj } from '@storybook/react-vite'
import { mapAdapterResultToChartGeometry, SpanActivityChart } from '@greese/authoring'
import '@greese/authoring/styles.css'

/** A clip's two property tracks, drawn across a span twice its length, so it repeats. */
const lines = mapAdapterResultToChartGeometry(
  {
    contentLength: 12,
    lines: [
      {
        id: 'x',
        label: 'x',
        colorIndex: 0,
        points: [
          { t: 0, v: 0 },
          { t: 6, v: 10 },
          { t: 12, v: 0 },
        ],
      },
      {
        id: 'y',
        label: 'y',
        colorIndex: 1,
        points: [
          { t: 0, v: 5 },
          { t: 12, v: -5 },
        ],
      },
    ],
  },
  24,
  {},
  14
)

/** A loop's notes as rows. */
const rows = mapAdapterResultToChartGeometry(
  {
    contentLength: 16,
    rows: [
      {
        id: 'kick',
        segments: [
          { start: 0, end: 1 },
          { start: 8, end: 9 },
        ],
      },
      {
        id: 'snare',
        segments: [
          { start: 4, end: 5 },
          { start: 12, end: 13 },
        ],
      },
      {
        id: 'hat',
        segments: [0, 2, 4, 6, 8, 10, 12, 14].map((s) => ({ start: s, end: s + 1 })),
      },
    ],
  },
  16,
  {},
  14
)

const meta = {
  title: 'Authoring/SpanActivityChart',
  component: SpanActivityChart,
  args: { variant: 'lines', geometry: lines, width: 336, height: 24 },
  argTypes: { geometry: { control: false } },
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'relative',
          inlineSize: 336,
          blockSize: 24,
          background: 'var(--greese-color-surface)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SpanActivityChart>
export default meta

type Story = StoryObj<typeof meta>

/** What's in a span, drawn on its bar: a clip's tracks as lines, repeating where the span repeats it. */
export const Playground: Story = {}

/** A loop's notes as rows. */
export const Rows: Story = { args: { variant: 'rows', geometry: rows, width: 224 } }
