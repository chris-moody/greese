import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import {
  createAuthoringEnvironment,
  emptyLayerState,
  LibraryPanel,
  libraryActions,
} from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

const setup = () => {
  const env = createAuthoringEnvironment()
  const { container } = render(
    <env.Provider>
      <LibraryPanel />
    </env.Provider>
  )
  const add = (id: string, name: string, category = 'graphic') =>
    act(() =>
      env.store.dispatch(
        libraryActions.addAsset({
          id,
          name,
          category,
          removing: false,
          scene: { layerState: emptyLayerState() },
        })
      )
    )
  return { env, add, container }
}

describe('LibraryPanel', () => {
  it('lists the library as a named tree, and passes axe', async () => {
    const { add, container } = setup()
    add('btn', 'Button')
    expect(screen.getByRole('tree', { name: 'Library' })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /Button/ })).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('creates a symbol of a kind, named, and opens it', () => {
    const { env } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    const name = screen.getByRole('textbox', { name: 'Name' })
    fireEvent.change(name, { target: { value: 'Logo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    const assets = [...env.store.getState().library.assets.values()]
    expect(assets.map((a) => [a.name, a.category])).toEqual([['Logo', 'graphic']])
    expect(env.store.getState().navigation.stack.map((f) => f.name)).toEqual(['Logo'])
  })

  it('opens an asset from its row', () => {
    const { env, add } = setup()
    add('btn', 'Button')
    fireEvent.click(screen.getByRole('button', { name: 'Open Button' }))
    expect(env.store.getState().navigation.stack.map((f) => f.assetId)).toEqual(['btn'])
  })

  it('splits categories into tabs once there are two', () => {
    const { add } = setup()
    add('btn', 'Button', 'graphic')
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    add('walk', 'Walk', 'animation')
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'graphic',
      'animation',
    ])
    fireEvent.click(screen.getByRole('tab', { name: 'animation' }))
    expect(screen.getByRole('treeitem', { name: /Walk/ })).toBeInTheDocument()
    expect(screen.queryByRole('treeitem', { name: /Button/ })).not.toBeInTheDocument()
  })
})
