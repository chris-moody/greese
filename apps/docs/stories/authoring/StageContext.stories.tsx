import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  createAuthoringEnvironment,
  GridControl,
  StageBar,
  StageColorControl,
  StageContext,
} from '@greese/authoring'
import { Text } from '@greese/react'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/StageContext',
  component: StageContext,
} satisfies Meta<typeof StageContext>
export default meta

type Story = StoryObj<typeof meta>

/**
 * The bar above the stage: a breadcrumb slot, the media's own controls
 * (`MediaConfig.stageBarSlot`, here a zoom readout) and the rulers' toggle,
 * which the editor's store keeps.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [env] = useState(() =>
      createAuthoringEnvironment({
        config: { stageBarSlot: () => <Text variant="caption">100%</Text> },
      })
    )
    return (
      <env.Provider>
        <StageContext {...args} />
      </env.Provider>
    )
  },
}

/**
 * A media whose slot is several controls side by side (Pixels' zoom, layout,
 * grid and stage color), beside breadcrumbs: one row across the whole bar,
 * scrolling sideways when it overflows.
 */
export const WithStageBar: Story = {
  render: function WithStageBar(args) {
    const [env] = useState(() =>
      createAuthoringEnvironment({
        config: {
          stageBarSlot: function Slot() {
            const [zoom, setZoom] = useState(1)
            const [grid, setGrid] = useState(true)
            const [color, setColor] = useState('#ffffff')
            return (
              <>
                <StageBar
                  zoom={zoom}
                  onZoomChange={setZoom}
                  onResetView={() => setZoom(1)}
                  layouts={[{ id: 'default', name: 'Default' }]}
                  activeLayoutId="default"
                  onSelectLayout={() => undefined}
                  onSaveLayout={() => undefined}
                  canSave
                />
                <GridControl
                  showGrid={grid}
                  onToggleGrid={() => setGrid(!grid)}
                  gridInterval={10}
                  onIntervalChange={() => undefined}
                />
                <StageColorControl color={color} onChange={setColor} />
              </>
            )
          },
        },
      })
    )
    return (
      <env.Provider>
        <StageContext
          {...args}
          breadcrumbs={<Text variant="caption">Scene › Hero</Text>}
        />
      </env.Provider>
    )
  },
}
