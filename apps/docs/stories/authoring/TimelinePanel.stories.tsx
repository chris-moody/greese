import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  createAuthoringEnvironment,
  layersActions,
  makeLayer,
  playbackActions,
  TimelinePanel,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

/** One layer, keyed at the start and the end. */
const animation = () => {
  const env = createAuthoringEnvironment()
  env.store.dispatch(playbackActions.setFrameCount(24))
  const layer = makeLayer({ name: 'Title' })
  env.store.dispatch(layersActions.addLayer({ layer }))
  for (const frame of [0, 23])
    env.store.dispatch(
      layersActions.addKeyframe({ layerId: layer.id, frame, value: frame })
    )
  return env
}

const meta = {
  title: 'Authoring/TimelinePanel',
  component: TimelinePanel,
  args: { hideMute: true },
} satisfies Meta<typeof TimelinePanel>
export default meta

type Story = StoryObj<typeof meta>

/** The timeline as a panel, filling it: for an editor that docks the timeline like any other panel. */
export const Playground: Story = {
  render: function Playground(args) {
    const [env] = useState(animation)
    return (
      <env.Provider>
        <div style={{ blockSize: 220 }}>
          <TimelinePanel {...args} />
        </div>
      </env.Provider>
    )
  },
}
