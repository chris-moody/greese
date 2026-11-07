'use client'
import { useCallback } from 'react'
import { isFolder } from '../core/types/tree.types.ts'
import type { AuthoringLayer } from '../core/types/layer.types.ts'
import {
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../environment/environment.tsx'
import {
  selectCollapsed,
  selectLayers,
  selectLayerSelection,
  selectRootOrder,
} from '../state/selectors.ts'
import { layersActions } from '../state/layers.slice.ts'
import { DEFAULT_LAYER_TYPE, makeFolder, makeLayer } from '../core/layers/layers.ts'

/**
 * Wires the shared layer store to the reusable `HierarchicalList`. Returns the
 * list props plus per-row toggle handlers, so `LayerTree` stays declarative.
 *
 * New layers are created under the selected folder by default (per the plan's
 * "create child layer under the currently selected layer").
 */
export const useLayerTreeController = () => {
  const dispatch = useAuthoringDispatch()
  const { config } = useAuthoringEnvironment()
  const layers = useAuthoringSelector(selectLayers)
  const rootOrder = useAuthoringSelector(selectRootOrder)
  const selection = useAuthoringSelector(selectLayerSelection)
  const collapsed = useAuthoringSelector(selectCollapsed)

  const parentIdForNew = useCallback((): string | undefined => {
    if (selection.size !== 1) return undefined
    const [only] = [...selection]
    const layer = only ? layers.get(only) : undefined
    return layer && isFolder(layer) ? only : undefined
  }, [selection, layers])

  const onSelect = useCallback(
    (ids: Set<string>) => dispatch(layersActions.setSelection([...ids])),
    [dispatch]
  )

  const onUpdate = useCallback(
    (updates: { id: string; updates: Partial<AuthoringLayer> }[]) =>
      dispatch(layersActions.updateLayers(updates)),
    [dispatch]
  )

  const onItemOrderChange = useCallback(
    (order: string[]) => dispatch(layersActions.setRootOrder(order)),
    [dispatch]
  )

  // Mirrors the stage's own Delete-key guard (`isLayerLocked`, e.g.
  // `neoPixelsPixiBackend.ts`) — a locked layer can't be deleted from the
  // layer tree either, even when it's part of a larger multi-selection.
  const onDeleteItems = useCallback(
    (ids: string[]) =>
      ids.forEach((id) => {
        const layer = layers.get(id)
        if (layer && !layer.locked) dispatch(layersActions.removeLayer(id))
      }),
    [dispatch, layers]
  )

  const onAddItem = useCallback(() => {
    const layerType = config.layerTypes?.[0]?.layerType ?? DEFAULT_LAYER_TYPE
    dispatch(
      layersActions.addLayer({
        layer: makeLayer({ name: 'New Layer', layerType }),
        parentId: parentIdForNew(),
      })
    )
  }, [dispatch, config, parentIdForNew])

  const onAddFolder = useCallback(() => {
    dispatch(
      layersActions.addLayer({
        layer: makeFolder('New Folder'),
        parentId: parentIdForNew(),
      })
    )
  }, [dispatch, parentIdForNew])

  const onToggleHidden = useCallback(
    (id: string) => {
      const layer = layers.get(id)
      if (layer)
        dispatch(layersActions.updateLayer({ id, updates: { hidden: !layer.hidden } }))
    },
    [dispatch, layers]
  )

  const onToggleLocked = useCallback(
    (id: string) => {
      const layer = layers.get(id)
      if (layer)
        dispatch(layersActions.updateLayer({ id, updates: { locked: !layer.locked } }))
    },
    [dispatch, layers]
  )

  const onToggleMuted = useCallback(
    (id: string) => {
      const layer = layers.get(id)
      if (layer)
        dispatch(layersActions.updateLayer({ id, updates: { muted: !layer.muted } }))
    },
    [dispatch, layers]
  )

  const onToggleCollapsed = useCallback(
    (id: string) => dispatch(layersActions.toggleLayerCollapsed(id)),
    [dispatch]
  )

  return {
    items: layers,
    itemOrder: rootOrder,
    selectedItems: selection,
    collapsedIds: collapsed,
    onSelect,
    onUpdate,
    onItemOrderChange,
    onDeleteItems,
    onAddItem,
    onAddFolder,
    onToggleHidden,
    onToggleLocked,
    onToggleMuted,
    onToggleCollapsed,
  }
}
