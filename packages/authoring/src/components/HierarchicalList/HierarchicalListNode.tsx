'use client'
import { memo, type DragEvent, type MouseEvent, type ReactNode } from 'react'
import {
  DropTargetPosition,
  isFolder,
  type TreeItemModel,
} from '../../core/types/tree.types.ts'
import type {
  HierarchicalListFolderProps,
  HierarchicalListItemProps,
  RowRenderProps,
} from './hierarchicalList.types.ts'
import { HierarchicalListFolder } from './HierarchicalListFolder.tsx'
import { HierarchicalListItem } from './HierarchicalListItem.tsx'

const defaultItem = <T extends TreeItemModel, U extends HierarchicalListItemProps<T>>(
  data: T,
  props?: U
): ReactNode => <HierarchicalListItem data={data} {...props} />

const defaultFolder = <T extends TreeItemModel, V extends HierarchicalListFolderProps<T>>(
  data: T,
  props?: V
): ReactNode => <HierarchicalListFolder data={data} {...props} />

export interface HierarchicalListNodeProps<
  T extends TreeItemModel,
  U extends HierarchicalListItemProps<T>,
  V extends HierarchicalListFolderProps<T>,
> {
  nodeId: string
  data: T
  depth: number
  flat: boolean
  /**
   * Every item, to find this node's children. Left out of the memo check: it
   * changes on any edit anywhere, which mustn't re-render an unchanged row.
   */
  items: ReadonlyMap<string, T>
  selectedItems: ReadonlySet<string>
  draggedItem: string | null
  dropTarget: { id: string; position: DropTargetPosition } | null
  collapsedIds: ReadonlySet<string>
  focusedId: string | null
  renameTarget: string | null
  disableRename: boolean | ((item: T) => boolean)
  isStructural?: (item: T) => boolean
  onToggleCollapsed: (id: string) => void
  renderItem?: (data: T, props?: U) => ReactNode
  renderFolder?: (data: T, props?: V) => ReactNode
  onUpdateItem: (update: { id: string; updates: Partial<T> }) => void
  setRenameTarget: (id: string | null) => void
  /** Stable handlers: they read live state through a ref, so their identity never changes. */
  handleDragStart: (id: string, e: DragEvent) => void
  handleDragOver: (id: string, e: DragEvent) => void
  handleDrop: (id: string, position: DropTargetPosition, e: DragEvent) => void
  handleDragEnd: () => void
  handleItemClick: (id: string, e: MouseEvent) => void
}

const NodeView = <
  T extends TreeItemModel,
  U extends HierarchicalListItemProps<T>,
  V extends HierarchicalListFolderProps<T>,
>(
  props: HierarchicalListNodeProps<T, U, V>
): ReactNode => {
  const { nodeId, data, depth, flat, items, collapsedIds, disableRename, isStructural } =
    props
  const hasChildren = !!data.children?.length
  const open = !collapsedIds.has(nodeId)
  const dropPosition =
    props.dropTarget?.id === nodeId ? props.dropTarget.position : undefined

  const row: RowRenderProps & { depth: number } = {
    depth: flat ? 0 : depth,
    dragged: props.draggedItem === nodeId,
    dropPosition,
    draggable: !isStructural?.(data),
    onDragStart: (e) => props.handleDragStart(nodeId, e),
    onDragOver: (e) => props.handleDragOver(nodeId, e),
    onDrop: (e) => props.handleDrop(nodeId, dropPosition ?? DropTargetPosition.BELOW, e),
    onDragEnd: props.handleDragEnd,
    onClick: (e) => props.handleItemClick(nodeId, e),
    hasChildren,
    collapsed: hasChildren ? !open : undefined,
    onToggleCollapsed: props.onToggleCollapsed,
    disableRename:
      typeof disableRename === 'function' ? disableRename(data) : disableRename,
    focusable: props.focusedId === nodeId,
    renameRequested: props.renameTarget === nodeId,
  }
  const selected = { ...data, selected: props.selectedItems.has(nodeId) }

  const renderChild = (childId: string, childDepth: number): ReactNode => {
    const child = items.get(childId)
    return child ? (
      <HierarchicalListNode
        {...props}
        key={childId}
        nodeId={childId}
        data={child}
        depth={childDepth}
      />
    ) : null
  }

  if (isFolder(data)) {
    return (props.renderFolder ?? defaultFolder)(selected, {
      ...row,
      onUpdate: props.onUpdateItem,
      setRenameTarget: props.setRenameTarget,
      renderChild,
      open,
      onToggle: props.onToggleCollapsed,
    } as V)
  }

  return (
    <>
      {(props.renderItem ?? defaultItem)(selected, {
        ...row,
        onUpdate: props.onUpdateItem,
        setRenameTarget: props.setRenameTarget,
      } as U)}
      {hasChildren && open && (
        <div role="none">{data.children!.map((id) => renderChild(id, depth + 1))}</div>
      )}
    </>
  )
}

/**
 * One row, and its open children. Memoized so an edit to one item re-renders
 * only that item's row: Immer replaces only what changed, so every other
 * row's props compare equal (`items` is left out on purpose, see its note).
 */
export const HierarchicalListNode = memo(NodeView, (prev, next) =>
  (Object.keys(next) as (keyof typeof next)[]).every(
    (key) => key === 'items' || prev[key] === next[key]
  )
) as typeof NodeView
