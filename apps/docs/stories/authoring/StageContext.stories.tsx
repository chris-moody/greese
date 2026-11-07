import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { createAuthoringEnvironment, StageContext } from '@greese/authoring'
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
