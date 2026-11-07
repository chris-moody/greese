import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import {
  createAuthoringEnvironment,
  LayerTree,
  layersActions,
  makeFolder,
  makeLayer,
} from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

const setup = (props: Parameters<typeof LayerTree>[0] = {}) => {
  const env = createAuthoringEnvironment({
    config: {
      layerTypes: [
        { layerType: 'layer', label: 'Layer' },
        { layerType: 'bus', label: 'Bus', structural: true },
      ],
    },
  })
  const add = (layer: ReturnType<typeof makeLayer>, parentId?: string) =>
    act(() => env.store.dispatch(layersActions.addLayer({ layer, parentId })))
  const utils = render(
    <env.Provider>
      <LayerTree {...props} />
    </env.Provider>
  )
  return { env, add, ...utils }
}

describe('LayerTree', () => {
  it('lists the store’s layers as a named tree, and passes axe', async () => {
    const { add, container } = setup()
    add(makeLayer({ name: 'Background', layerType: 'layer' }))
    add(makeLayer({ name: 'Title', layerType: 'layer' }))
    expect(screen.getByRole('tree', { name: 'Layers' })).toBeInTheDocument()
    expect(screen.getAllByRole('treeitem').map((row) => row.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Title'),
        expect.stringContaining('Background'),
      ])
    )
    await expectNoAxeViolations(container)
  })

  it('adds a layer into the selected folder, and a folder', () => {
    const { env, add } = setup()
    const folder = makeFolder('Characters')
    add(folder)
    act(() => env.store.dispatch(layersActions.setSelection([folder.id])))
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    const { layers } = env.store.getState()
    const added = [...layers.layers.values()].find((l) => l.name === 'New Layer')!
    expect(added.parent).toBe(folder.id)
    fireEvent.click(screen.getByRole('button', { name: 'Add folder' }))
    expect([...env.store.getState().layers.layers.values()].map((l) => l.name)).toContain(
      'New Folder'
    )
  })

  it('toggles visibility and lock, saying which layer and whether it’s on', () => {
    const { env, add } = setup()
    const title = makeLayer({ name: 'Title', layerType: 'layer' })
    add(title)
    const hide = screen.getByRole('button', { name: 'Hide Title' })
    expect(hide).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(hide)
    expect(env.store.getState().layers.layers.get(title.id)!.hidden).toBe(true)
    expect(screen.getByRole('button', { name: 'Hide Title' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Lock Title' }))
    expect(env.store.getState().layers.layers.get(title.id)!.locked).toBe(true)
  })

  it('keeps locked layers when deleting, and shows a structural type’s lock as permanent', () => {
    const { env, add } = setup()
    const kept = makeLayer({ name: 'Kept', layerType: 'layer' })
    const gone = makeLayer({ name: 'Gone', layerType: 'layer' })
    add(kept)
    add(gone)
    add(makeLayer({ name: 'Main', layerType: 'bus' }))
    act(() => {
      env.store.dispatch(
        layersActions.updateLayer({ id: kept.id, updates: { locked: true } })
      )
      env.store.dispatch(layersActions.setSelection([kept.id, gone.id]))
    })
    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }))
    const names = [...env.store.getState().layers.layers.values()].map((l) => l.name)
    expect(names).toContain('Kept')
    expect(names).not.toContain('Gone')
    expect(screen.getByRole('button', { name: 'Main is locked' })).toBeDisabled()
  })

  it('reports a right-click with the layer and where it was', () => {
    const onLayerContextMenu = vi.fn()
    const { add } = setup({ onLayerContextMenu })
    const title = makeLayer({ name: 'Title', layerType: 'layer' })
    add(title)
    fireEvent.contextMenu(screen.getByRole('treeitem', { name: /Title/ }), {
      clientX: 12,
      clientY: 34,
    })
    expect(onLayerContextMenu).toHaveBeenCalledWith(title.id, { top: 34, left: 12 })
  })
})
