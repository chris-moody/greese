import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { createAuthoringEnvironment, StageHost } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/StageHost',
  component: StageHost,
  args: { label: 'Stage' },
} satisfies Meta<typeof StageHost>
export default meta

type Story = StoryObj<typeof meta>

/**
 * The stage mounts the media's backend from `MediaConfig.createStage` (Pixi,
 * SVG, a canvas) and turns clicks into selection, double-clicks into opening
 * a symbol, and dropped library assets into instances. With no backend, as
 * here, it says so.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [env] = useState(() =>
      createAuthoringEnvironment({ config: { mediaType: 'svg' } })
    )
    return (
      <div
        style={{ blockSize: '12rem', border: '1px dashed var(--greese-color-border)' }}
      >
        <env.Provider>
          <StageHost {...args} />
        </env.Provider>
      </div>
    )
  },
}
