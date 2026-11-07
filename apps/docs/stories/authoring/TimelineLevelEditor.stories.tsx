import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  createAuthoringEnvironment,
  TimelineLevelEditor,
  type LevelPoint,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

const tempo: LevelPoint[] = [
  { id: 'a', tick: 0, value: 120 },
  { id: 'b', tick: 200, value: 90 },
  { id: 'c', tick: 400, value: 140 },
]

const meta = {
  title: 'Authoring/TimelineLevelEditor',
  component: TimelineLevelEditor,
  args: {
    points: tempo,
    min: 60,
    max: 180,
    width: 480,
    height: 120,
    pixelsPerTick: 1,
    onPointsChange: () => undefined,
  },
  argTypes: { points: { control: false }, onPointsChange: { control: false } },
} satisfies Meta<typeof TimelineLevelEditor>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A curve across the timeline: a tempo here. Drag a point to move it,
 * double-click to add one, marquee to select several, Delete to remove them.
 */
export const Playground: Story = {
  render: function Playground(args) {
    // It reads the editor's selection, so it sits in an editor's environment.
    const [env] = useState(() => createAuthoringEnvironment())
    const [points, setPoints] = useState(tempo)
    return (
      <env.Provider>
        <div
          style={{ position: 'relative', inlineSize: args.width, blockSize: args.height }}
        >
          <TimelineLevelEditor {...args} points={points} onPointsChange={setPoints} />
        </div>
      </env.Provider>
    )
  },
}
