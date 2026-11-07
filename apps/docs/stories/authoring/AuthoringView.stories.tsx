import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  AuthoringView,
  createAuthoringEnvironment,
  LayerTree,
  layersActions,
  makeLayer,
  MarkerPanel,
  PanelArea,
  playbackActions,
  TweenPanel,
  type PanelRegistrant,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

const panels: PanelRegistrant[] = [
  { id: 'layers', title: 'Layers', area: PanelArea.LEFT, component: () => <LayerTree /> },
  { id: 'tween', title: 'Tween', area: PanelArea.RIGHT, component: TweenPanel },
  { id: 'marker', title: 'Marker', area: PanelArea.RIGHT, component: MarkerPanel },
]

/** A two-layer animation, two seconds long. */
const editor = () => {
  const env = createAuthoringEnvironment()
  env.store.dispatch(playbackActions.setFrameCount(48))
  for (const name of ['Background', 'Ball']) {
    const layer = makeLayer({ name })
    env.store.dispatch(layersActions.addLayer({ layer }))
    env.store.dispatch(
      layersActions.addKeyframe({ layerId: layer.id, frame: 0, value: 0 })
    )
  }
  return env
}

const meta = {
  title: 'Authoring/AuthoringView',
  component: AuthoringView,
  args: { panels },
  argTypes: { panels: { control: false }, timeline: { control: false } },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AuthoringView>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A whole editor: panels docked around the stage and the timeline. Drag a
 * tab to rearrange; the stage shows the media's renderer, an empty one here.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [env] = useState(editor)
    return (
      <env.Provider>
        <div style={{ blockSize: 560 }}>
          <AuthoringView {...args} />
        </div>
      </env.Provider>
    )
  },
}

/** Without a timeline: a still image's editor. */
export const Timelineless: Story = {
  args: { timeline: false },
  render: function Timelineless(args) {
    const [env] = useState(editor)
    return (
      <env.Provider>
        <div style={{ blockSize: 400 }}>
          <AuthoringView {...args} />
        </div>
      </env.Provider>
    )
  },
}
