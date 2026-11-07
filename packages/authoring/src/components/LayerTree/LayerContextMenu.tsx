import type { JSX } from 'react'
import { uid } from '../../core/uid.ts'
import { ContextMenu, MenuItem, MenuSeparator } from '@greese/react'
import { useAuthoringEnvironment } from '../../environment/environment.tsx'
import { layersActions } from '../../state/layers.slice.ts'
import { isFolder } from '../../core/types/tree.types.ts'
import type { AuthoringRootState } from '../../state/createAuthoringStore.ts'
import { useTimelineEditing } from '../../timeline/useTimelineEditing.ts'
import { DEFAULT_LAYER_TYPE, makeFolder, makeLayer } from '../../core/layers/layers.ts'

export interface LayerContextMenuProps {
  /** The layer the menu is for; `null` while it's closed. */
  layerId: string | null
  /** Where it opens, in viewport pixels; `null` closes it. */
  position: { top: number; left: number } | null
  /** Called when it closes: an action chosen, Escape, or a click away. */
  onClose: () => void
}

/**
 * A layer row's right-click menu: add a layer or folder beside it (or in it),
 * duplicate, hide, lock, paste keyframes into it, delete. Structural layers
 * can't be duplicated or deleted, and a layer type can hide actions
 * (`hiddenContextMenuActions`). `LayerTree` opens it on a right-click.
 *
 * ```tsx
 * <LayerContextMenu layerId={id} position={at} onClose={close} />
 * ```
 */
export const LayerContextMenu = ({
  layerId,
  position,
  onClose,
}: LayerContextMenuProps): JSX.Element => {
  const { store, config } = useAuthoringEnvironment()
  const dispatch = store.dispatch
  const { pasteIntoLayer } = useTimelineEditing()

  const run = (action: () => void) => () => {
    action()
    onClose()
  }

  const layer = layerId
    ? (store.getState() as AuthoringRootState).layers.layers.get(layerId)
    : undefined
  const open = position !== null && !!layer
  const layerType = config.layerTypes?.[0]?.layerType ?? DEFAULT_LAYER_TYPE
  const parentId = layer && isFolder(layer) ? layer.id : layer?.parent

  // `structural` (e.g. Sound Studio's "Main" master-bus row) blocks Duplicate/
  // Delete unconditionally; `hiddenContextMenuActions` additionally hides
  // specific actions per-row for media whose exclusions are screen-dependent
  // (e.g. Sound Studio's Arrangement vs. Loop views share this one menu).
  const layerTypeDef = layer
    ? config.layerTypes?.find((d) => d.layerType === layer.layerType)
    : undefined
  const isStructural = !!layerTypeDef?.structural
  const hiddenActions = layer
    ? (config.hiddenContextMenuActions?.(layer) ?? new Set())
    : new Set()
  const extraActions =
    layer && !isStructural ? (config.extraContextMenuActions?.(layer, store) ?? []) : []

  const duplicate = () => {
    if (!layer) return
    const copy = makeLayer({
      name: `${layer.name} copy`,
      layerType: layer.layerType,
      hidden: layer.hidden,
      locked: layer.locked,
      properties: { ...layer.properties },
    })
    // Copy frames with fresh ids and remap the tweens onto them.
    const idMap = new Map<string, string>()
    const frames = layer.timeline.frames.map((f) => {
      const id = uid()
      idMap.set(f.id, id)
      return { ...f, id }
    })
    const tweens = layer.timeline.tweens.map((t) => ({
      ...t,
      id: uid(),
      startKeyframeId: idMap.get(t.startKeyframeId) ?? t.startKeyframeId,
      endKeyframeId: idMap.get(t.endKeyframeId) ?? t.endKeyframeId,
    }))
    copy.timeline = { frames, tweens }
    dispatch(layersActions.addLayer({ layer: copy, parentId: layer.parent }))
  }

  return (
    <ContextMenu anchor={open ? position : null} onClose={onClose}>
      {!hiddenActions.has('newLayer') && (
        <MenuItem
          onSelect={run(() =>
            dispatch(
              layersActions.addLayer({
                layer: makeLayer({ name: 'New Layer', layerType }),
                parentId,
              })
            )
          )}
        >
          New Layer
        </MenuItem>
      )}
      {!hiddenActions.has('newFolder') && (
        <MenuItem
          onSelect={run(() =>
            dispatch(
              layersActions.addLayer({ layer: makeFolder('New Folder'), parentId })
            )
          )}
        >
          New Folder
        </MenuItem>
      )}
      {!isStructural && !hiddenActions.has('duplicate') && (
        <MenuItem onSelect={run(duplicate)}>Duplicate</MenuItem>
      )}
      {extraActions.length > 0 && <MenuSeparator />}
      {extraActions.map((action) => (
        <MenuItem
          key={action.key}
          onSelect={run(action.onClick)}
          disabled={action.disabled}
        >
          {action.label}
        </MenuItem>
      ))}
      <MenuSeparator />
      {!hiddenActions.has('showHide') && (
        <MenuItem
          onSelect={run(
            () =>
              layer &&
              dispatch(
                layersActions.updateLayer({
                  id: layer.id,
                  updates: { hidden: !layer.hidden },
                })
              )
          )}
        >
          {layer?.hidden ? 'Show' : 'Hide'}
        </MenuItem>
      )}
      <MenuItem
        onSelect={run(
          () =>
            layer &&
            dispatch(
              layersActions.updateLayer({
                id: layer.id,
                updates: { locked: !layer.locked },
              })
            )
        )}
      >
        {layer?.locked ? 'Unlock' : 'Lock'}
      </MenuItem>
      <MenuItem onSelect={run(() => layer && pasteIntoLayer(layer.id))}>
        Paste Into Layer
      </MenuItem>
      <MenuSeparator />
      {!isStructural && (
        <MenuItem
          onSelect={run(() => layer && dispatch(layersActions.removeLayer(layer.id)))}
        >
          Delete
        </MenuItem>
      )}
    </ContextMenu>
  )
}
