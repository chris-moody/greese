import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  createAuthoringEnvironment,
  GuidesOverlay,
  guidesActions,
  StageRulers,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

/** An editor with a horizontal guide, a vertical one, and a global one. */
const guidedEnvironment = () => {
  const env = createAuthoringEnvironment()
  env.store.dispatch(guidesActions.addGuide({ axis: 'h', pos: -40 }))
  env.store.dispatch(guidesActions.addGuide({ axis: 'v', pos: 80 }))
  env.store.dispatch(guidesActions.addGuide({ axis: 'h', pos: 60, isGlobal: true }))
  return env
}

const meta = {
  title: 'Authoring/GuidesOverlay',
  component: GuidesOverlay,
  args: { offsetX: 0, offsetY: 0, scale: 1 },
} satisfies Meta<typeof GuidesOverlay>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Guides over the stage, global ones in their own color. Drag one to move it,
 * double-click it for its properties, or Tab to it: the arrow keys move it,
 * Enter opens its properties, Delete removes it. Drag out of a ruler for a new
 * one.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [env] = useState(guidedEnvironment)
    return (
      <div
        style={{
          position: 'relative',
          blockSize: '16rem',
          border: '1px solid var(--greese-color-border)',
        }}
      >
        <env.Provider>
          <StageRulers
            offsetX={args.offsetX}
            offsetY={args.offsetY}
            scale={args.scale}
            onPreviewGuide={(type, pos) =>
              env.store.dispatch(
                guidesActions.setPendingGuide({
                  axis: type === 'horizontal' ? 'h' : 'v',
                  pos,
                })
              )
            }
            onCreateGuide={(type, pos) =>
              env.store.dispatch(
                guidesActions.addGuide({ axis: type === 'horizontal' ? 'h' : 'v', pos })
              )
            }
          />
          <GuidesOverlay {...args} />
        </env.Provider>
      </div>
    )
  },
}
