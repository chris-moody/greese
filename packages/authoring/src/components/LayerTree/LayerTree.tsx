'use client'
import { memo, useCallback, type JSX, type MouseEvent, type ReactNode } from 'react'
import type { DropTargetPosition } from '../../core/types/tree.types.ts'
import type { AuthoringLayer } from '../../core/types/layer.types.ts'
import { useAuthoringEnvironment } from '../../environment/environment.tsx'
import { useLayerTreeController } from '../../hooks/useLayerTreeController.ts'
import { HierarchicalList } from '../HierarchicalList/HierarchicalList.tsx'
import { LayerTreeItem, type LayerTreeItemProps } from './LayerTreeItem.tsx'

export interface LayerTreeProps {
  /** The tree's accessible name. @default 'Layers' */
  label?: string
  /** Leaves scrolling to a parent: the timeline, when the tree is its label column. */
  disableScroll?: boolean
  /** Hides the add, delete and folder buttons: a structure that isn't edited here (a bone tree). */
  hideItemActions?: boolean
  /** Hides only Add layer: layers come from elsewhere (recording). */
  hideAddItem?: boolean
  /** Every layer at the first level, without indentation. */
  flat?: boolean
  /** Hides the mute toggle: only sound editors have one. */
  hideMute?: boolean
  /** Turns renaming off, for every row or for the rows a predicate picks. */
  disableRename?: boolean | ((item: AuthoringLayer) => boolean)
  /** Whether the dragged layers may land there: an editor's own nesting rules. */
  canDrop?: (
    draggedIds: string[],
    target: AuthoringLayer,
    position: DropTargetPosition
  ) => boolean
  /** Takes a drag from elsewhere (a library asset) dropped on the tree. */
  onExternalDrop?: (draggedIds: string[]) => void
  /** Asks before deleting a folder that has layers in it. */
  confirmNonEmptyFolderDelete?: boolean
  /** Called with a layer's id and the pointer's position when its row is right-clicked: open a menu there. */
  onLayerContextMenu?: (layerId: string, at: { top: number; left: number }) => void
  /** Renders a row in place of `LayerTreeItem`, with the toggles' handlers in its props. */
  renderItem?: (data: AuthoringLayer, props?: LayerTreeItemProps) => ReactNode
}

/**
 * The editor's layers as a tree, bound to its store: nest, reorder, rename,
 * select, hide, lock and mute; add layers (into the selected folder) and
 * folders; delete the selection, locked layers excepted. Layer types the
 * config marks `structural` can't be dragged or deleted.
 *
 * ```tsx
 * const layersPanel = { id: 'layers', title: 'Layers', area: PanelArea.LEFT, component: () => <LayerTree /> }
 * ```
 */
export const LayerTree = memo(function LayerTree({
  label = 'Layers',
  disableScroll,
  hideItemActions,
  hideAddItem,
  flat,
  hideMute,
  disableRename,
  canDrop,
  onExternalDrop,
  confirmNonEmptyFolderDelete,
  onLayerContextMenu,
  renderItem,
}: LayerTreeProps): JSX.Element {
  const { config } = useAuthoringEnvironment()
  const {
    onToggleHidden,
    onToggleLocked,
    onToggleMuted: toggleMuted,
    onAddItem,
    onDeleteItems,
    onAddFolder,
    ...list
  } = useLayerTreeController()
  const onToggleMuted = hideMute ? undefined : toggleMuted

  // A layer type is structural once, in the config, for every tree and timeline.
  const isStructural = useCallback(
    (item: AuthoringLayer) =>
      !!config.layerTypes.find((type) => type.layerType === item.layerType)?.structural,
    [config.layerTypes]
  )

  const contextMenu = useCallback(
    (layerId: string) => (event: MouseEvent<HTMLElement>) => {
      if (!onLayerContextMenu) return
      event.preventDefault()
      event.stopPropagation()
      onLayerContextMenu(layerId, { top: event.clientY, left: event.clientX })
    },
    [onLayerContextMenu]
  )

  const renderRow = useCallback(
    (data: AuthoringLayer, props?: LayerTreeItemProps) => {
      const actions = {
        onToggleHidden,
        onToggleLocked,
        onToggleMuted,
        onContextMenu: contextMenu(data.id),
      }
      if (renderItem) return renderItem(data, { data, ...actions, ...props })
      return (
        <LayerTreeItem
          data={data}
          {...actions}
          structural={isStructural(data)}
          {...props}
          onContextMenu={actions.onContextMenu}
        />
      )
    },
    [onToggleHidden, onToggleLocked, onToggleMuted, contextMenu, renderItem, isStructural]
  )

  return (
    <HierarchicalList<AuthoringLayer, LayerTreeItemProps>
      {...list}
      {...(!hideItemActions && {
        onAddItem: hideAddItem ? undefined : onAddItem,
        onDeleteItems,
        onAddFolder,
      })}
      label={label}
      className="greese-LayerTree"
      renderItem={renderRow}
      disableScroll={disableScroll}
      flat={flat}
      disableRename={disableRename}
      isStructural={isStructural}
      canDrop={canDrop}
      onExternalDrop={onExternalDrop}
      confirmNonEmptyFolderDelete={confirmNonEmptyFolderDelete}
      stickyActions={!hideItemActions}
    />
  )
})
