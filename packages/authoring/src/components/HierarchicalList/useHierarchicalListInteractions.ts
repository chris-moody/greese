'use client'
import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import {
  DropTargetPosition,
  isFolder,
  type TreeItemModel,
} from '../../core/types/tree.types.ts'
import {
  collectDescendantIds,
  flattenItemOrder,
  flattenVisibleOrder,
  moveItemsIntoFolder,
  removeIds,
  reorderItems,
  type HierarchyUpdateResult,
} from '../../core/tree/hierarchicalList.ts'
import { extractDraggedIds } from '../../core/dnd.ts'

export interface UseHierarchicalListInteractionsArgs<T extends TreeItemModel> {
  items: Map<string, T>
  itemOrder: string[]
  selectedItems: Set<string>
  onSelect?: (selectedIds: Set<string>) => void
  onUpdate?: (updates: { id: string; updates: Partial<T> }[]) => void
  onItemOrderChange?: (order: string[]) => void
  onDeleteItems?: (itemIds: string[]) => void
  onExternalDrop?: (draggedIds: string[]) => void
  canDrop?: (draggedIds: string[], target: T, position: DropTargetPosition) => boolean
  isStructural?: (item: T) => boolean
  confirmNonEmptyFolderDelete: boolean
  /** The rows whose children are hidden, controlled or the list's own. */
  collapsedIds: ReadonlySet<string>
  onToggleCollapsed: (id: string) => void
}

/**
 * Drag-and-drop, selection, and delete interaction logic for
 * {@link HierarchicalList}. Extracted so the component file stays focused on
 * composition/render — every handler here that's embedded in a row
 * (`handleDragStart`/`handleDragOver`/`handleDrop`/`handleDragEnd`/
 * `handleItemClick`) is a stable (`useCallback`, empty-deps) reference that
 * reads current props/state through `live` rather than closing over them
 * directly, so its identity never changes across renders while its behavior
 * always reflects the latest render — required for
 * `components/HierarchicalListNode`'s memoization to actually skip work; see
 * that file's doc comment.
 */
export const useHierarchicalListInteractions = <T extends TreeItemModel>({
  items,
  itemOrder,
  selectedItems,
  onSelect,
  onUpdate,
  onItemOrderChange,
  onDeleteItems,
  onExternalDrop,
  canDrop,
  isStructural,
  confirmNonEmptyFolderDelete,
  collapsedIds,
  onToggleCollapsed,
}: UseHierarchicalListInteractionsArgs<T>) => {
  const rootRef = useRef<HTMLDivElement>(null)
  // The row that takes Tab into the tree (roving focus, WAI-ARIA tree).
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    id: string
    position: DropTargetPosition
  } | null>(null)
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null)

  // Latest props/state, read by the stable (`useCallback`, empty-deps)
  // handlers below instead of closing over them directly — lets those
  // handlers keep one identity across renders (required for
  // `HierarchicalListNode`'s memoization to actually skip work) while always
  // behaving correctly.
  const live = useRef({
    items,
    itemOrder,
    selectedItems,
    draggedItem,
    dropTarget,
    onSelect,
    onUpdate,
    onItemOrderChange,
    onDeleteItems,
    onExternalDrop,
    canDrop,
    isStructural,
    confirmNonEmptyFolderDelete,
  })
  live.current = {
    items,
    itemOrder,
    selectedItems,
    draggedItem,
    dropTarget,
    onSelect,
    onUpdate,
    onItemOrderChange,
    onDeleteItems,
    onExternalDrop,
    canDrop,
    isStructural,
    confirmNonEmptyFolderDelete,
  }

  /** The dragged item plus any co-selected siblings — mirrors `handleDragStart`'s `dataTransfer` payload. */
  const draggedIdsFor = (itemId: string): string[] => {
    const { selectedItems: sel } = live.current
    return sel.has(itemId) ? Array.from(sel) : [itemId]
  }

  const handleItemClick = useCallback((itemId: string, event: MouseEvent) => {
    const {
      onSelect: select,
      selectedItems: sel,
      items: currentItems,
      itemOrder: order,
    } = live.current
    if (!select) return
    setFocusedId(itemId)
    const newSelection = new Set(sel)
    const visibleOrder = flattenItemOrder(currentItems, order)

    if (event.shiftKey) {
      const clickedIndex = visibleOrder.indexOf(itemId)
      const selectedArray = Array.from(sel)
      if (selectedArray.length > 0 && clickedIndex !== -1) {
        const lastSelected = selectedArray[selectedArray.length - 1]
        if (lastSelected) {
          const lastSelectedIndex = visibleOrder.indexOf(lastSelected)
          if (lastSelectedIndex !== -1) {
            const start = Math.min(clickedIndex, lastSelectedIndex)
            const end = Math.max(clickedIndex, lastSelectedIndex)
            for (let i = start; i <= end; i++) {
              const idInRange = visibleOrder[i]
              if (idInRange) newSelection.add(idInRange)
            }
          }
        }
      } else {
        newSelection.add(itemId)
      }
    } else if (event.metaKey || event.ctrlKey) {
      if (newSelection.has(itemId)) newSelection.delete(itemId)
      else newSelection.add(itemId)
    } else {
      newSelection.clear()
      newSelection.add(itemId)
    }

    select(newSelection)
  }, [])

  const handleDragStart = useCallback((itemId: string, event: DragEvent) => {
    setDraggedItem(itemId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('itemId', itemId)
    const { selectedItems: sel } = live.current
    if (sel.has(itemId)) {
      event.dataTransfer.setData('selectedItems', JSON.stringify(Array.from(sel)))
    }
  }, [])

  const handleDragOver = useCallback((itemId: string, event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const rect = event.currentTarget.getBoundingClientRect()
    const mouseY = event.clientY - rect.top
    const itemHeight = rect.height
    const {
      items: currentItems,
      canDrop: canDropFn,
      draggedItem: currentDragged,
    } = live.current
    const item = currentItems.get(itemId)
    let position: DropTargetPosition

    if (item && isFolder(item)) {
      if (mouseY < itemHeight / 3) position = DropTargetPosition.ABOVE
      else if (mouseY > (2 * itemHeight) / 3) position = DropTargetPosition.BELOW
      else position = DropTargetPosition.INTO
    } else {
      position =
        mouseY < itemHeight / 2 ? DropTargetPosition.ABOVE : DropTargetPosition.BELOW
    }

    if (
      item &&
      canDropFn &&
      currentDragged &&
      !canDropFn(draggedIdsFor(currentDragged), item, position)
    ) {
      setDropTarget(null)
      return
    }

    setDropTarget({ id: itemId, position })
  }, [])

  /** The dragged id(s) on the drag, whether or not this list has them. */
  const rawDraggedIds = (event: DragEvent): string[] => extractDraggedIds(event)

  const handleContainerDragOver = (event: DragEvent) => {
    if (!onExternalDrop) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleContainerDrop = (event: DragEvent) => {
    if (!onExternalDrop) return
    event.preventDefault()
    const raw = rawDraggedIds(event)
    if (raw.length > 0 && raw.every((id) => !items.has(id))) onExternalDrop(raw)
    setDraggedItem(null)
    setDropTarget(null)
  }

  const handleDrop = useCallback(
    (targetId: string, position: DropTargetPosition, event: DragEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const {
        items: currentItems,
        itemOrder: order,
        canDrop: canDropFn,
        onExternalDrop: externalDrop,
        onItemOrderChange: orderChange,
        onUpdate: update,
      } = live.current

      const raw = rawDraggedIds(event)
      const idsToMove = raw.filter((id) => currentItems.has(id))

      if (idsToMove.length === 0) {
        if (externalDrop && raw.length > 0) externalDrop(raw)
        setDraggedItem(null)
        setDropTarget(null)
        return
      }

      const targetItem = currentItems.get(targetId)
      if (targetItem && canDropFn && !canDropFn(idsToMove, targetItem, position)) {
        setDraggedItem(null)
        setDropTarget(null)
        return
      }

      let result: HierarchyUpdateResult<T> | null = null

      if (position === DropTargetPosition.INTO) {
        if (targetItem && isFolder(targetItem)) {
          result = moveItemsIntoFolder(currentItems, order, idsToMove, targetId)
        }
      } else {
        result = reorderItems(currentItems, order, idsToMove, targetId, position)
      }

      if (result) {
        const ordersMatch =
          result.itemOrder.length === order.length &&
          result.itemOrder.every((id, index) => id === order[index])
        if (!ordersMatch) orderChange?.(result.itemOrder)
        if (result.updates.length > 0) update?.(result.updates)
      }

      setDraggedItem(null)
      setDropTarget(null)
    },
    []
  )

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDropTarget(null)
  }, [])

  /** Expand `ids` to include every descendant, so deleting a folder (or any node with children) doesn't orphan them. */
  const expandDeletions = (ids: string[]): string[] => {
    const all = new Set(ids)
    for (const id of ids)
      for (const descendantId of collectDescendantIds(items, id)) all.add(descendantId)
    return Array.from(all)
  }

  const commitDelete = (ids: string[]) => {
    if (!onDeleteItems || ids.length === 0) return
    const deletions = expandDeletions(ids)
    const { itemOrder: newOrder, updates } = removeIds(items, itemOrder, deletions)
    onDeleteItems(deletions)
    onItemOrderChange?.(newOrder)
    onUpdate?.(updates)
  }

  const handleDelete = () => {
    if (!onDeleteItems || selectedItems.size === 0) return
    const ids = Array.from(selectedItems).filter((id) => {
      const target = items.get(id)
      return !target || !isStructural?.(target)
    })
    if (ids.length === 0) return

    const hasNonEmptyFolder = ids.some((id) => {
      const target = items.get(id)
      return target && isFolder(target) && (target.children?.length ?? 0) > 0
    })
    if (confirmNonEmptyFolderDelete && hasNonEmptyFolder) {
      setPendingDeleteIds(ids)
      return
    }
    commitDelete(ids)
  }

  /** Moves focus (and the selection, or extends it with Shift) to a row. */
  const moveTo = (id: string | undefined, extend: boolean) => {
    if (!id) return
    setFocusedId(id)
    const select = live.current.onSelect
    if (select)
      select(extend ? new Set([...live.current.selectedItems, id]) : new Set([id]))
    // The row exists once the tree has rendered; it's focusable at -1 until then.
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(id)}"]`)
      ?.focus()
  }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (renameTarget) return
      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedItems.size > 0
      ) {
        event.preventDefault()
        // Also keeps the key from window-level Delete listeners (a timeline
        // keymap); `data-owns-delete-key` on the root says so too.
        event.stopPropagation()
        handleDelete()
        return
      }
      // Tree navigation (WAI-ARIA APG tree view), from the focused row.
      const visible = flattenVisibleOrder(items, itemOrder, collapsedIds as Set<string>)
      // The row the key came from; the last focused one if it came from elsewhere.
      const fromRow = (event.target as HTMLElement).closest<HTMLElement>('[data-tree-id]')
        ?.dataset.treeId
      const current =
        (fromRow && visible.includes(fromRow) && fromRow) ||
        (focusedId && visible.includes(focusedId) ? focusedId : visible[0])
      if (!current) return
      const index = visible.indexOf(current)
      const item = items.get(current)
      const hasChildren = !!item?.children?.length
      const open = hasChildren && !collapsedIds.has(current)
      switch (event.key) {
        case 'ArrowDown':
          moveTo(visible[index + 1], event.shiftKey)
          break
        case 'ArrowUp':
          moveTo(visible[index - 1], event.shiftKey)
          break
        case 'Home':
          moveTo(visible[0], false)
          break
        case 'End':
          moveTo(visible[visible.length - 1], false)
          break
        case 'ArrowRight':
          if (hasChildren && !open) onToggleCollapsed(current)
          else if (open) moveTo(item!.children![0], false)
          break
        case 'ArrowLeft':
          if (open) onToggleCollapsed(current)
          else moveTo(item?.parent, false)
          break
        case 'Enter':
        case ' ':
          live.current.onSelect?.(new Set([current]))
          break
        case 'F2':
          setRenameTarget(current)
          break
        default:
          return
      }
      event.preventDefault()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      renameTarget,
      selectedItems,
      items,
      itemOrder,
      collapsedIds,
      focusedId,
      onToggleCollapsed,
    ]
  )

  const onUpdateItem = useCallback((update: { id: string; updates: Partial<T> }) => {
    live.current.onUpdate?.([update])
  }, [])

  // Mirrors `handleDelete`'s own guard — marked only while a Delete press
  // here would actually delete something, otherwise it correctly falls
  // through to a `window`-level listener elsewhere instead of being silently
  // swallowed. See `ownsDeleteKey`'s doc comment for why this marker exists.
  const canDeleteSelection =
    !renameTarget &&
    [...selectedItems].some((id) => {
      const target = items.get(id)
      return !target || !isStructural?.(target)
    })

  return {
    rootRef,
    focusedId,
    draggedItem,
    dropTarget,
    renameTarget,
    setRenameTarget,
    pendingDeleteIds,
    setPendingDeleteIds,
    handleItemClick,
    handleDragStart,
    handleDragOver,
    handleContainerDragOver,
    handleContainerDrop,
    handleDrop,
    handleDragEnd,
    expandDeletions,
    commitDelete,
    handleDelete,
    handleKeyDown,
    onUpdateItem,
    canDeleteSelection,
  }
}
