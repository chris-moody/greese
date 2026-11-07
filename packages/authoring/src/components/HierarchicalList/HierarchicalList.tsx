'use client'
import { useCallback, useState, type JSX } from 'react'
import {
  Button,
  cx,
  Dialog,
  Divider,
  IconButton,
  Tooltip,
  composeRefs,
} from '@greese/react'
import { FolderPlusIcon, ImportIcon, PlusIcon, TrashIcon } from '@greese/icons'
import { isFolder, type TreeItemModel } from '../../core/types/tree.types.ts'
import type {
  HierarchicalListFolderProps,
  HierarchicalListItemProps,
  HierarchicalListProps,
} from './hierarchicalList.types.ts'
import { HierarchicalListNode } from './HierarchicalListNode.tsx'
import { useHierarchicalListInteractions } from './useHierarchicalListInteractions.ts'

const folderIds = <T extends TreeItemModel>(items: Map<string, T>): Set<string> =>
  new Set([...items.values()].filter(isFolder).map((item) => item.id))

/**
 * A tree of items to select, reorder and nest: layers, library assets,
 * anything with an id, a name and children. A WAI-ARIA tree: the arrow keys
 * move through it (Left and Right close and open), Shift extends the
 * selection, F2 renames, Delete removes. Rows drag above, below or into
 * folders, the whole selection at once. An actions bar adds, imports and
 * deletes.
 *
 * ```tsx
 * <HierarchicalList
 *   label="Layers"
 *   items={layers}
 *   itemOrder={order}
 *   selectedItems={selected}
 *   onSelect={setSelected}
 *   onItemOrderChange={setOrder}
 *   onDeleteItems={remove}
 * />
 * ```
 */
export const HierarchicalList = <
  T extends TreeItemModel = TreeItemModel,
  U extends HierarchicalListItemProps<T> = HierarchicalListItemProps<T>,
  V extends HierarchicalListFolderProps<T> = HierarchicalListFolderProps<T>,
>({
  label,
  items,
  itemOrder = [],
  selectedItems,
  onUpdate,
  onItemOrderChange,
  onSelect,
  onAddItem,
  onDeleteItems,
  onAddFolder,
  onImportItem,
  renderItem,
  renderFolder,
  header,
  disableScroll = false,
  collapsedIds: controlledCollapsed,
  onToggleCollapsed: onToggleControlled,
  disableRename = false,
  isStructural,
  canDrop,
  onExternalDrop,
  confirmNonEmptyFolderDelete = false,
  flat = false,
  stickyActions = false,
  className,
  ref,
  ...props
}: HierarchicalListProps<T, U, V>): JSX.Element => {
  // Uncontrolled, the list keeps which rows are closed: folders start closed.
  const [ownCollapsed, setOwnCollapsed] = useState(() => folderIds(items))
  const collapsedIds = controlledCollapsed ?? ownCollapsed
  const onToggleCollapsed = useCallback(
    (id: string) => {
      if (onToggleControlled) return onToggleControlled(id)
      setOwnCollapsed((closed) => {
        const next = new Set(closed)
        if (!next.delete(id)) next.add(id)
        return next
      })
    },
    [onToggleControlled]
  )

  const list = useHierarchicalListInteractions({
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
  })
  // Tab lands on the focused row, else the first selected, else the first.
  const focusedId =
    (list.focusedId && items.has(list.focusedId) && list.focusedId) ||
    itemOrder.find((id) => selectedItems.has(id)) ||
    itemOrder[0] ||
    null

  return (
    <div
      {...props}
      ref={composeRefs(list.rootRef, ref)}
      className={cx('greese-HierarchicalList', className)}
      // Window-level keymaps (a timeline's Delete, an editor's copy and
      // paste) leave these keys to the list while it has them.
      data-owns-delete-key={list.canDeleteSelection ? '' : undefined}
      data-owns-clipboard-key=""
      data-owns-clipboard-key-in-place=""
    >
      {header}
      <div
        className="greese-HierarchicalList-tree"
        role="tree"
        aria-label={label}
        aria-multiselectable={onSelect ? true : undefined}
        data-scroll={disableScroll ? 'none' : undefined}
        onKeyDown={list.handleKeyDown}
        onDragOver={list.handleContainerDragOver}
        onDrop={list.handleContainerDrop}
      >
        {itemOrder.map((id) => {
          const data = items.get(id)
          if (!data) return null
          return (
            <HierarchicalListNode
              key={id}
              nodeId={id}
              data={data}
              depth={0}
              flat={flat}
              items={items}
              selectedItems={selectedItems}
              draggedItem={list.draggedItem}
              dropTarget={list.dropTarget}
              collapsedIds={collapsedIds}
              focusedId={focusedId}
              renameTarget={list.renameTarget}
              disableRename={disableRename}
              isStructural={isStructural}
              onToggleCollapsed={onToggleCollapsed}
              renderItem={renderItem}
              renderFolder={renderFolder}
              onUpdateItem={list.onUpdateItem}
              setRenameTarget={list.setRenameTarget}
              handleDragStart={list.handleDragStart}
              handleDragOver={list.handleDragOver}
              handleDrop={list.handleDrop}
              handleDragEnd={list.handleDragEnd}
              handleItemClick={list.handleItemClick}
            />
          )
        })}
      </div>
      {(onAddItem || onImportItem || onDeleteItems || onAddFolder) && (
        <>
          <Divider />
          <div
            className="greese-HierarchicalList-actions"
            data-sticky={stickyActions ? '' : undefined}
          >
            {onAddItem && (
              <Tooltip content="Add item">
                <IconButton size="sm" label="Add item" onClick={onAddItem}>
                  <PlusIcon />
                </IconButton>
              </Tooltip>
            )}
            {onImportItem && (
              <Tooltip content="Import…">
                <IconButton size="sm" label="Import…" onClick={onImportItem}>
                  <ImportIcon />
                </IconButton>
              </Tooltip>
            )}
            {onDeleteItems && (
              <Tooltip content="Delete selected">
                <IconButton
                  size="sm"
                  label="Delete selected"
                  onClick={list.handleDelete}
                  disabled={selectedItems.size === 0}
                >
                  <TrashIcon />
                </IconButton>
              </Tooltip>
            )}
            {onAddFolder && (
              <Tooltip content="Add folder">
                <IconButton size="sm" label="Add folder" onClick={onAddFolder}>
                  <FolderPlusIcon />
                </IconButton>
              </Tooltip>
            )}
          </div>
        </>
      )}
      <Dialog
        open={list.pendingDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) list.setPendingDeleteIds(null)
        }}
        title="Delete folder?"
        footer={
          <>
            <Button variant="ghost" onClick={() => list.setPendingDeleteIds(null)}>
              Cancel
            </Button>
            <Button
              tone="negative"
              onClick={() => {
                if (list.pendingDeleteIds) list.commitDelete(list.pendingDeleteIds)
                list.setPendingDeleteIds(null)
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {list.pendingDeleteIds &&
          `Delete ${list.pendingDeleteIds.length > 1 ? 'these items' : 'this folder'} and ${
            list.expandDeletions(list.pendingDeleteIds).length -
            list.pendingDeleteIds.length
          } item(s) inside?`}
      </Dialog>
    </div>
  )
}
