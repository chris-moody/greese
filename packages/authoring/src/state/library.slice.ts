/** Library slice — normalized store of reusable nested assets. */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { uid } from '../core/uid.ts'
import type { LibraryAsset, LibraryStoreState } from '../core/types/library.types.ts'
import type { LayerStoreState } from '../core/types/layer.types.ts'
import { emptyLayerState } from '../core/layers/layers.ts'
import { enableMapSet } from 'immer'

// This slice holds Sets or Maps; Immer drafts them only with its MapSet
// plugin, whichever way the reducer is reached (idempotent).
enableMapSet()

const initialState: LibraryStoreState = {
  assets: new Map(),
  itemOrder: [],
  selection: new Set(),
}

export const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    addAsset: (state, action: PayloadAction<LibraryAsset>) => {
      state.assets.set(action.payload.id, action.payload)
      if (!state.itemOrder.includes(action.payload.id))
        state.itemOrder.push(action.payload.id)
    },
    /** Create a new asset with an empty scene, ready to open as a subview. */
    createSymbol: (state, action: PayloadAction<{ name: string; category?: string }>) => {
      const id = uid()
      state.assets.set(id, {
        id,
        name: action.payload.name,
        category: action.payload.category ?? 'symbol',
        removing: false,
        scene: { layerState: emptyLayerState() },
      })
      state.itemOrder.push(id)
    },
    renameAsset: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const asset = state.assets.get(action.payload.id)
      if (asset) asset.name = action.payload.name
    },
    /**
     * Saves an edited subview's scene back to its asset. Placed instances of
     * `id` elsewhere need no sync of their own — an instance layer composites
     * its referenced asset's *current* scene live at render time (see
     * `NeoPixelsPixiBackend.compositeInstance`), so saving here is all that's
     * needed for every instance of it to pick up the change automatically.
     */
    updateAssetScene: (
      state,
      action: PayloadAction<{ id: string; layerState: LayerStoreState }>
    ) => {
      const { id, layerState } = action.payload
      const asset = state.assets.get(id)
      if (!asset) return
      asset.scene = { layerState }
    },
    removeAsset: (state, action: PayloadAction<string>) => {
      state.assets.delete(action.payload)
      state.itemOrder = state.itemOrder.filter((x) => x !== action.payload)
      state.selection.delete(action.payload)
    },
    setItemOrder: (state, action: PayloadAction<string[]>) => {
      state.itemOrder = action.payload
    },
    setSelection: (state, action: PayloadAction<string[]>) => {
      state.selection = new Set(action.payload)
    },
  },
})

export const libraryActions = librarySlice.actions
export const libraryReducer = librarySlice.reducer
