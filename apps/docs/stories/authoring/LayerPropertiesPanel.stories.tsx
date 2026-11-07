import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  createAuthoringEnvironment,
  LayerPropertiesPanel,
  layersActions,
  makeLayer,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

/** One layer, selected. */
const selected = () => {
  const env = createAuthoringEnvironment()
  const layer = makeLayer({ name: 'Ball' })
  env.store.dispatch(layersActions.addLayer({ layer }))
  env.store.dispatch(layersActions.setSelection([layer.id]))
  return env
}

const meta = {
  title: 'Authoring/LayerPropertiesPanel',
  component: LayerPropertiesPanel,
} satisfies Meta<typeof LayerPropertiesPanel>
export default meta

type Story = StoryObj<typeof meta>

/** The selected layer's type, name, visibility and lock. */
export const Playground: Story = {
  render: function Playground() {
    const [env] = useState(selected)
    return (
      <env.Provider>
        <div style={{ maxInlineSize: '20rem' }}>
          <LayerPropertiesPanel />
        </div>
      </env.Provider>
    )
  },
}
