import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import {
  createAuthoringEnvironment,
  emptyLayerState,
  LibraryPanel,
  libraryActions,
} from '@greese/authoring'
import { Text } from '@greese/react'
import '@greese/authoring/styles.css'

/** An editor with three symbols: two graphics and an animation. */
const seededEnvironment = () => {
  const env = createAuthoringEnvironment()
  for (const [id, name, category] of [
    ['button', 'Button', 'graphic'],
    ['logo', 'Logo', 'graphic'],
    ['walk', 'Walk cycle', 'animation'],
  ] as const) {
    env.store.dispatch(
      libraryActions.addAsset({
        id,
        name,
        category,
        removing: false,
        scene: { layerState: emptyLayerState() },
      })
    )
  }
  return env
}

const meta = {
  title: 'Authoring/LibraryPanel',
  component: LibraryPanel,
  args: { label: 'Library' },
} satisfies Meta<typeof LibraryPanel>
export default meta

type Story = StoryObj<typeof meta>

/**
 * The editor's symbols, by category. Open edits one in its own subview (the
 * line below says which is open); Add asks for a kind and a name, then opens
 * the new one.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [env] = useState(seededEnvironment)
    const [open, setOpen] = useState('none')
    // The store's subscribe returns its unsubscribe, the effect's cleanup.
    useEffect(
      () =>
        env.store.subscribe(() =>
          setOpen(env.store.getState().navigation.stack.at(-1)?.name ?? 'none')
        ),
      [env]
    )
    return (
      <div style={{ blockSize: '20rem', maxInlineSize: '22rem' }}>
        <env.Provider>
          <LibraryPanel {...args} />
        </env.Provider>
        <Text variant="caption">Open: {open}</Text>
      </div>
    )
  },
}
