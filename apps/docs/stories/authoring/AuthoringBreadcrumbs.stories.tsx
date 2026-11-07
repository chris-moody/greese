import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  AuthoringBreadcrumbs,
  createAuthoringEnvironment,
  NavMode,
  navigationActions,
} from '@greese/authoring'
import { FilmIcon, HomeIcon } from '@greese/icons'
import '@greese/authoring/styles.css'

/** An editor two symbols deep: a button opened inside a toolbar. */
const nestedEnvironment = () => {
  const env = createAuthoringEnvironment()
  for (const [assetId, name] of [
    ['toolbar', 'Toolbar'],
    ['button', 'Button'],
  ] as const) {
    env.store.dispatch(
      navigationActions.pushFrame({
        assetId,
        name,
        mode: NavMode.ISOLATED,
        parentLayers: env.store.getState().layers,
        stageTransform: null,
      })
    )
  }
  return env
}

const meta = {
  title: 'Authoring/AuthoringBreadcrumbs',
  component: AuthoringBreadcrumbs,
  args: { label: 'Subview trail' },
} satisfies Meta<typeof AuthoringBreadcrumbs>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Where the editor is among nested symbols. Each step but the current one goes
 * back to it; at the top level the trail hides.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [env] = useState(nestedEnvironment)
    return (
      <env.Provider>
        <AuthoringBreadcrumbs {...args} />
      </env.Provider>
    )
  },
}

/**
 * Each step marked with its environment's icon and hue (`accent`), after a
 * step the host supplies (`leading`): here, back to the page that opened the
 * editor.
 */
export const Accents: Story = {
  render: function Accents(args) {
    const [env] = useState(nestedEnvironment)
    const [opened, setOpened] = useState(0)
    return (
      <env.Provider>
        <AuthoringBreadcrumbs
          {...args}
          accent={(assetId) =>
            assetId ? { icon: <FilmIcon />, hue: 300 } : { icon: <HomeIcon />, hue: 150 }
          }
          leading={
            <button type="button" onClick={() => setOpened(opened + 1)}>
              Library{opened > 0 && ` (${opened})`}
            </button>
          }
        />
      </env.Provider>
    )
  },
}
