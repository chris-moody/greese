/**
 * Hierarchy operations — pure, media-agnostic tree edits over
 * {@link TreeItemModel}. Extracted from the legacy `packages/pixels` (since
 * removed) `dndListPanel.helpers`.
 * Every function returns a {@link HierarchyUpdateResult} (new root order + the
 * per-node `children`/`parent` patches to apply) so callers stay in control of
 * how state is committed.
 */
import { DropTargetPosition, isFolder, type TreeItemModel } from '../types/tree.types.ts'

export interface HierarchyUpdateResult<T extends TreeItemModel> {
  itemOrder: string[]
  updates: { id: string; updates: Partial<T> }[]
}

const uniqueIds = (ids: string[]): string[] => Array.from(new Set(ids))

export const removeIds = <T extends TreeItemModel>(
  items: Map<string, T>,
  rootOrder: string[],
  ids: string[]
): HierarchyUpdateResult<T> => {
  const { rootOrder: nextRootOrder, childUpdates } = detachIdsFromHierarchy(
    items,
    rootOrder,
    ids
  )
  const updates = collectChildUpdates<T>(childUpdates)
  return { itemOrder: nextRootOrder, updates }
}

const detachIdsFromHierarchy = <T extends TreeItemModel>(
  items: Map<string, T>,
  rootOrder: string[],
  ids: string[]
): { rootOrder: string[]; childUpdates: Map<string, string[]> } => {
  const idSet = new Set(ids)
  const nextRootOrder = rootOrder.filter((id) => !idSet.has(id))
  const childUpdates = new Map<string, string[]>()

  const targetItems = ids.flatMap((id) => {
    const item = items.get(id)
    return item ? [item] : []
  })
  const parents = new Map<string, T>()
  targetItems.forEach((target) => {
    const parent = items.get(target.parent ?? '')
    if (parent && parent.id) parents.set(parent.id, parent)
  })

  parents.forEach((parent) => {
    if (!parent) return
    const children = parent.children
    if (Array.isArray(children) && children.length > 0) {
      const filtered = children.filter((childId) => !idSet.has(childId))
      if (filtered.length !== children.length) {
        childUpdates.set(parent.id, filtered)
      }
    }
  })

  return { rootOrder: nextRootOrder, childUpdates }
}

const collectChildUpdates = <T extends TreeItemModel>(
  entries: Map<string, string[]>
): { id: string; updates: Partial<T> }[] => {
  const updates: { id: string; updates: Partial<T> }[] = []
  entries.forEach((children, parentId) => {
    updates.push({
      id: parentId,
      updates: { children: [...children] } as Partial<T>,
    })
  })
  return updates
}

/**
 * Every descendant id of `id` (pre-order, not including `id` itself) — used
 * to expand a delete selection so removing a folder (or any node with
 * children, e.g. a note layer's property-tween children) doesn't leave its
 * former children orphaned in the store (see `HierarchicalList.handleDelete`).
 */
export const collectDescendantIds = <T extends TreeItemModel>(
  items: Map<string, T>,
  id: string
): string[] => {
  const item = items.get(id)
  if (!item?.children?.length) return []
  const result: string[] = []
  for (const childId of item.children) {
    result.push(childId)
    result.push(...collectDescendantIds(items, childId))
  }
  return result
}

const isDescendant = <T extends TreeItemModel>(
  items: Map<string, T>,
  ancestorId: string,
  targetId: string
): boolean => {
  const ancestor = items.get(ancestorId)
  if (!ancestor?.children || ancestor.children.length === 0) return false
  if (ancestor.children.includes(targetId)) return true
  return ancestor.children.some((childId) => isDescendant(items, childId, targetId))
}

/** Flatten the hierarchy into display order (pre-order traversal). */
export const flattenItemOrder = <T extends TreeItemModel>(
  items: Map<string, T>,
  order: string[]
): string[] => {
  const result: string[] = []
  const traverse = (ids: string[]) => {
    ids.forEach((id) => {
      result.push(id)
      const item = items.get(id)
      if (Array.isArray(item?.children) && item.children.length > 0) {
        traverse(item.children)
      }
    })
  }
  traverse(order)
  return result
}

/**
 * Flatten to *visible* display order — the same rows a `HierarchicalList` renders
 * given the current collapse state. Any node's children are skipped while it's
 * collapsed, folder or not — a plain node with children (e.g. an armature bone
 * chain, a Sound Studio note layer's property tracks) is just as collapsible as
 * a folder. This keeps the timeline's frame rows aligned with the layer tree.
 */
export const flattenVisibleOrder = <T extends TreeItemModel>(
  items: Map<string, T>,
  order: string[],
  collapsed: Set<string>
): string[] => {
  const result: string[] = []
  const traverse = (ids: string[]) => {
    ids.forEach((id) => {
      result.push(id)
      const item = items.get(id)
      const children = item?.children
      if (!children || children.length === 0) return
      if (collapsed.has(id)) return
      traverse(children)
    })
  }
  traverse(order)
  return result
}

/** Reorder items relative to a target within the same parent list. */
export const reorderItems = <T extends TreeItemModel>(
  items: Map<string, T>,
  itemOrder: string[],
  idsToMove: string[],
  targetId: string,
  position: DropTargetPosition
): HierarchyUpdateResult<T> => {
  const normalizedIds = uniqueIds(idsToMove)
  if (normalizedIds.length === 0) return { itemOrder: [...itemOrder], updates: [] }
  if (normalizedIds.includes(targetId)) return { itemOrder: [...itemOrder], updates: [] }

  const target = items.get(targetId)
  if (!target) return { itemOrder: [...itemOrder], updates: [] }

  const targetParentId = target.parent ?? undefined

  const invalidTarget = normalizedIds.some((id) => isDescendant(items, id, targetId))
  if (invalidTarget) {
    return { itemOrder: [...itemOrder], updates: [] }
  }

  const { rootOrder: detachedRootOrder, childUpdates } = detachIdsFromHierarchy(
    items,
    itemOrder,
    normalizedIds
  )

  const baseOrder = targetParentId
    ? (
        childUpdates.get(targetParentId) ??
        items.get(targetParentId)?.children ??
        []
      ).filter((id) => !normalizedIds.includes(id))
    : [...detachedRootOrder]

  const targetIndex = baseOrder.indexOf(targetId)
  if (targetIndex === -1) {
    return { itemOrder: [...itemOrder], updates: [] }
  }

  let insertIndex = position === DropTargetPosition.ABOVE ? targetIndex : targetIndex + 1
  insertIndex = Math.max(0, Math.min(insertIndex, baseOrder.length))

  const updatedOrder = [...baseOrder]
  updatedOrder.splice(insertIndex, 0, ...normalizedIds)

  let nextRootOrder = detachedRootOrder
  if (targetParentId) {
    childUpdates.set(targetParentId, updatedOrder)
  } else {
    nextRootOrder = updatedOrder
  }

  const updates = collectChildUpdates<T>(childUpdates)

  normalizedIds.forEach((id) => {
    const currentParent = items.get(id)?.parent ?? undefined
    if (currentParent !== targetParentId) {
      updates.push({
        id,
        updates: { parent: targetParentId } as Partial<T>,
      })
    }
  })

  return { itemOrder: [...nextRootOrder], updates }
}

/** Move items into a folder, updating parent/child references and root order. */
export const moveItemsIntoFolder = <T extends TreeItemModel>(
  items: Map<string, T>,
  itemOrder: string[],
  idsToMove: string[],
  folderId: string,
  insertionIndex = Infinity
): HierarchyUpdateResult<T> => {
  const normalizedIds = uniqueIds(idsToMove)
  if (normalizedIds.length === 0) return { itemOrder: [...itemOrder], updates: [] }
  const folder = items.get(folderId)
  if (!folder || !isFolder(folder)) {
    return { itemOrder: [...itemOrder], updates: [] }
  }
  if (normalizedIds.includes(folderId)) {
    return { itemOrder: [...itemOrder], updates: [] }
  }
  // Prevent moving a parent into its own descendant
  const invalidMove = normalizedIds.some((id) => isDescendant(items, id, folderId))
  if (invalidMove) {
    return { itemOrder: [...itemOrder], updates: [] }
  }

  const { rootOrder: detachedRootOrder, childUpdates } = detachIdsFromHierarchy(
    items,
    itemOrder,
    normalizedIds
  )

  const existingChildren = childUpdates.get(folderId) ?? folder.children ?? []
  const cleanedChildren = existingChildren.filter((id) => !normalizedIds.includes(id))
  const index = Math.max(0, Math.min(insertionIndex, cleanedChildren.length))
  const updatedChildren = [...cleanedChildren]
  updatedChildren.splice(index, 0, ...normalizedIds)
  childUpdates.set(folderId, updatedChildren)

  const updates = collectChildUpdates<T>(childUpdates)

  normalizedIds.forEach((id) => {
    const currentParent = items.get(id)?.parent ?? undefined
    if (currentParent !== folderId) {
      updates.push({
        id,
        updates: { parent: folderId } as Partial<T>,
      })
    }
  })

  return { itemOrder: [...detachedRootOrder], updates }
}
