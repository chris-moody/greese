import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Text } from '@greese/react'
import { createAuthoringEnvironment, TimelineHeader } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/TimelineHeader',
  component: TimelineHeader,
  args: { onZoomIn: () => undefined, onZoomOut: () => undefined, hideRecording: true },
  argTypes: { onZoomIn: { control: false }, onZoomOut: { control: false } },
} satisfies Meta<typeof TimelineHeader>
export default meta

type Story = StoryObj<typeof meta>

/**
 * The timeline's transport and tools: undo and redo, play, loop, snapping,
 * automatic keyframes, add and remove frames (hold to repeat), and zoom.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [env] = useState(() => createAuthoringEnvironment())
    const [zoom, setZoom] = useState(1)
    const [frames, setFrames] = useState(24)
    return (
      <env.Provider>
        <TimelineHeader
          {...args}
          onZoomIn={() => setZoom(zoom * 1.25)}
          onZoomOut={() => setZoom(zoom / 1.25)}
          onAddFrame={() => setFrames(frames + 1)}
          onRemoveFrame={() => setFrames(Math.max(1, frames - 1))}
        />
        <Text variant="caption" tone="muted">
          {frames} frames at {Math.round(zoom * 100)}%
        </Text>
      </env.Provider>
    )
  },
}
