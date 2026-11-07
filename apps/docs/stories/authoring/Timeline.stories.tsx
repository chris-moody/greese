import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  createAuthoringEnvironment,
  layersActions,
  makeLayer,
  playbackActions,
  Timeline,
  timelineActions,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

/** A short animation: a ball keyed and tweened, a shadow held, and a marker. */
const animation = () => {
  const env = createAuthoringEnvironment()
  env.store.dispatch(playbackActions.setFrameCount(36))
  const ball = makeLayer({ name: 'Ball' })
  const shadow = makeLayer({ name: 'Shadow' })
  env.store.dispatch(layersActions.addLayer({ layer: shadow }))
  env.store.dispatch(layersActions.addLayer({ layer: ball }))
  for (const frame of [0, 12, 24])
    env.store.dispatch(
      layersActions.addKeyframe({ layerId: ball.id, frame, value: frame })
    )
  env.store.dispatch(
    layersActions.addKeyframe({ layerId: shadow.id, frame: 0, value: 0 })
  )
  const [a, b] = env.store.getState().layers.layers.get(ball.id)!.timeline.frames
  env.store.dispatch(
    layersActions.createTween({
      layerId: ball.id,
      startKeyframeId: a!.id,
      endKeyframeId: b!.id,
    })
  )
  env.store.dispatch(
    timelineActions.addMarker({ scope: 'root', frame: 12, label: 'Bounce' })
  )
  return env
}

const meta = {
  title: 'Authoring/Timeline',
  component: Timeline,
  args: { hideMute: true },
} satisfies Meta<typeof Timeline>
export default meta

type Story = StoryObj<typeof meta>

/**
 * An editor's timeline: the layers beside their frames, keyframes, tweens and
 * holds, a marker on the ruler, and the transport above. Play runs on
 * greese.js; drag the playhead to scrub.
 */
export const Playground: Story = {
  parameters: { replay: false },
  render: function Playground(args) {
    const [env] = useState(animation)
    return (
      <env.Provider>
        <div style={{ blockSize: 260 }}>
          <Timeline {...args} />
        </div>
      </env.Provider>
    )
  },
}
