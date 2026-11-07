import { describe, expect, it } from 'vitest'
import { createAuthoringStore } from './createAuthoringStore.ts'
import { layersActions } from './layers.slice.ts'
import { libraryActions } from './library.slice.ts'
import { navigationActions, NavMode } from './navigation.slice.ts'
import { silent } from './commandsMiddleware.ts'
import { makeLayer } from '../core/layers/layers.ts'
import type { AuthoringRootState } from './createAuthoringStore.ts'

const state = (store: ReturnType<typeof createAuthoringStore>) =>
  store.getState() as AuthoringRootState

describe('library slice', () => {
  it('createSymbol adds an asset with an empty scene', () => {
    const store = createAuthoringStore()
    store.dispatch(libraryActions.createSymbol({ name: 'Sym' }))
    const assets = [...state(store).library.assets.values()]
    expect(assets).toHaveLength(1)
    expect(assets[0]!.name).toBe('Sym')
    expect(assets[0]!.scene?.layerState.layers.size).toBe(0)
  })

  it('renames an asset', () => {
    const store = createAuthoringStore()
    store.dispatch(libraryActions.createSymbol({ name: 'Sym' }))
    const id = state(store).library.itemOrder[0]!
    store.dispatch(libraryActions.renameAsset({ id, name: 'Renamed' }))
    expect(state(store).library.assets.get(id)!.name).toBe('Renamed')
  })
})

describe('nested subview navigation (round trip)', () => {
  it('opens an asset scene, edits it, then saves + restores on the way back', () => {
    const store = createAuthoringStore()
    store.dispatch(
      silent(
        layersActions.addLayer({
          layer: makeLayer({ id: 'root', name: 'Root', layerType: 'x' }),
        })
      )
    )
    store.dispatch(libraryActions.createSymbol({ name: 'Sym' }))
    const assetId = state(store).library.itemOrder[0]!

    // openAsset: remember parent, load the asset's (empty) scene
    const before = state(store)
    store.dispatch(
      navigationActions.pushFrame({
        assetId,
        name: 'Sym',
        mode: NavMode.ISOLATED,
        parentLayers: before.layers,
        stageTransform: null,
      })
    )
    store.dispatch(
      layersActions.loadLayerState(before.library.assets.get(assetId)!.scene!.layerState)
    )
    expect(state(store).layers.layers.size).toBe(0)

    // edit inside the asset
    store.dispatch(
      layersActions.addLayer({
        layer: makeLayer({ id: 'inner', name: 'Inner', layerType: 'x' }),
      })
    )

    // navigateTo(root): save the asset scene, restore the parent
    const current = state(store)
    store.dispatch(
      libraryActions.updateAssetScene({ id: assetId, layerState: current.layers })
    )
    store.dispatch(
      layersActions.loadLayerState(current.navigation.stack[0]!.parentLayers)
    )
    store.dispatch(navigationActions.setStack([]))

    const after = state(store)
    expect(after.layers.layers.has('root')).toBe(true) // parent restored
    expect(after.layers.layers.has('inner')).toBe(false)
    expect(after.library.assets.get(assetId)!.scene!.layerState.layers.has('inner')).toBe(
      true
    ) // saved
  })
})
