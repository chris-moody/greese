import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  createAuthoringEnvironment,
  LayerTree,
  layersActions,
  makeFolder,
  makeLayer,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

/** An editor with a few layers: a folder with two in it, and two at the top. */
const seededEnvironment = () => {
  const env = createAuthoringEnvironment()
  const add = (layer: ReturnType<typeof makeLayer>, parentId?: string) =>
    env.store.dispatch(layersActions.addLayer({ layer, parentId }))
  const folder = makeFolder('Characters')
  add(makeLayer({ name: 'Background', layerType: 'layer' }))
  add(folder)
  add(makeLayer({ name: 'Hero', layerType: 'layer' }), folder.id)
  add(makeLayer({ name: 'Sidekick', layerType: 'layer' }), folder.id)
  add(makeLayer({ name: 'Title', layerType: 'layer' }))
  return env
}

const meta = {
  title: 'Authoring/LayerTree',
  component: LayerTree,
  // A graphics editor's layers: visibility and lock, no mute.
  args: { label: 'Layers', hideMute: true },
} satisfies Meta<typeof LayerTree>
export default meta

type Story = StoryObj<typeof meta>

/**
 * The editor's layers, from its store: select, rename (F2 or a double-click),
 * drag to reorder and nest, hide, lock, and add layers (into the selected
 * folder) and folders. Locked layers survive a delete.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [env] = useState(seededEnvironment)
    return (
      <div style={{ blockSize: '20rem', maxInlineSize: '22rem' }}>
        <env.Provider>
          <LayerTree {...args} />
        </env.Provider>
      </div>
    )
  },
}

/** Sound layers can be muted: a sound editor leaves `hideMute` off. */
export const WithMute: Story = {
  args: { hideMute: false },
  render: function WithMute(args) {
    const [env] = useState(seededEnvironment)
    return (
      <div style={{ blockSize: '20rem', maxInlineSize: '22rem' }}>
        <env.Provider>
          <LayerTree {...args} />
        </env.Provider>
      </div>
    )
  },
}
