import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  createAuthoringEnvironment,
  layersActions,
  makeLayer,
  timelineActions,
  TweenPanel,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

/** A layer with one tween, selected. */
const tweened = () => {
  const env = createAuthoringEnvironment()
  const layer = makeLayer({ name: 'Ball' })
  env.store.dispatch(layersActions.addLayer({ layer }))
  for (const frame of [0, 12])
    env.store.dispatch(
      layersActions.addKeyframe({ layerId: layer.id, frame, value: frame })
    )
  const [a, b] = env.store.getState().layers.layers.get(layer.id)!.timeline.frames
  env.store.dispatch(
    layersActions.createTween({
      layerId: layer.id,
      startKeyframeId: a!.id,
      endKeyframeId: b!.id,
    })
  )
  const tween = env.store.getState().layers.layers.get(layer.id)!.timeline.tweens[0]!
  env.store.dispatch(
    timelineActions.selectTween({ layerId: layer.id, tweenId: tween.id })
  )
  return env
}

const meta = {
  title: 'Authoring/TweenPanel',
  component: TweenPanel,
} satisfies Meta<typeof TweenPanel>
export default meta

type Story = StoryObj<typeof meta>

/**
 * The selected tween's interpolation (an ease, or a bezier curve you drag),
 * whether it's on, and its rotation and bounds.
 */
export const Playground: Story = {
  render: function Playground() {
    const [env] = useState(tweened)
    return (
      <env.Provider>
        <div style={{ maxInlineSize: '20rem' }}>
          <TweenPanel />
        </div>
      </env.Provider>
    )
  },
}
