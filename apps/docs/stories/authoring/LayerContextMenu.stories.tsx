import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button, Stack, Text } from '@greese/react'
import {
  createAuthoringEnvironment,
  LayerContextMenu,
  layersActions,
  makeLayer,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

/** One layer for the menu to act on. */
const withLayer = () => {
  const env = createAuthoringEnvironment()
  const layer = makeLayer({ name: 'Ball' })
  env.store.dispatch(layersActions.addLayer({ layer }))
  return { env, layerId: layer.id }
}

const meta = {
  title: 'Authoring/LayerContextMenu',
  component: LayerContextMenu,
  args: { layerId: null, position: null, onClose: () => undefined },
  argTypes: {
    layerId: { control: false },
    position: { control: false },
    onClose: { control: false },
  },
} satisfies Meta<typeof LayerContextMenu>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A layer row's right-click menu, which `LayerTree` opens: add a layer or a
 * folder, duplicate, hide, lock, paste keyframes into it, delete.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [{ env, layerId }] = useState(withLayer)
    const [at, setAt] = useState<{ top: number; left: number } | null>(null)
    const [count, setCount] = useState(1)
    return (
      <env.Provider>
        <Stack gap={2} align="start">
          <Button onClick={(event) => setAt({ top: event.clientY, left: event.clientX })}>
            Open the menu
          </Button>
          <Text variant="caption" tone="muted">
            {count} {count === 1 ? 'layer' : 'layers'}
          </Text>
        </Stack>
        <LayerContextMenu
          {...args}
          layerId={layerId}
          position={at}
          onClose={() => {
            setAt(null)
            setCount(env.store.getState().layers.layers.size)
          }}
        />
      </env.Provider>
    )
  },
}
