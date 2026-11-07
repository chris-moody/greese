'use client'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { Input } from '@greese/react'
import type { TreeItemModel } from '../../core/types/tree.types.ts'
import type { HierarchicalListItemProps } from './hierarchicalList.types.ts'

/**
 * A `HierarchicalList` row: the item's name, renamed in place by
 * double-click or F2 (Enter keeps it, Escape drops it). The list hands each
 * row its selection, drag handlers, depth and focus; a custom row spreads
 * them onto its own element.
 *
 * ```tsx
 * <HierarchicalList
 *   label="Layers"
 *   renderItem={(data, props) => <HierarchicalListItem data={data} {...props} icon={<EyeIcon />} />}
 *   {...list}
 * />
 * ```
 */
export const HierarchicalListItem = <T extends TreeItemModel = TreeItemModel>({
  data,
  icon,
  iconPosition = 'start',
  onUpdate,
  setRenameTarget,
  depth = 0,
  dragged,
  dropPosition,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onClick,
  onContextMenu,
  disableRename,
  hasChildren,
  collapsed,
  focusable,
  renameRequested,
}: HierarchicalListItemProps<T>): JSX.Element => {
  const { id, name, selected = false } = data
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(name)
  const field = useRef<HTMLInputElement>(null)

  const startRename = () => {
    if (disableRename) return
    setRenameTarget?.(id)
    setDraft(name)
    setRenaming(true)
  }

  // F2 on the focused row asks for a rename through the list.
  useEffect(() => {
    if (renameRequested && !renaming && !disableRename) {
      setDraft(name)
      setRenaming(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renameRequested])

  useEffect(() => {
    if (renaming) {
      field.current?.focus()
      field.current?.select()
    }
  }, [renaming])

  const finish = (keep: boolean) => {
    if (keep && draft.trim() && draft.trim() !== name)
      onUpdate?.({ id, updates: { name: draft.trim() } as Partial<T> })
    setRenameTarget?.(null)
    setRenaming(false)
  }

  const onFieldKeyDown = (event: KeyboardEvent) => {
    // The field's keys are its own: not the tree's arrows or Delete.
    event.stopPropagation()
    if (event.key === 'Enter') {
      event.preventDefault()
      finish(true)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      finish(false)
    }
  }

  return (
    // A div, not a button: rows hold buttons of their own (a folder's toggle,
    // a layer's visibility and lock), which a button can't contain.
    <div
      className="greese-HierarchicalList-row"
      role="treeitem"
      aria-level={depth + 1}
      aria-selected={selected}
      aria-expanded={hasChildren ? !collapsed : undefined}
      tabIndex={focusable ? 0 : -1}
      data-tree-id={id}
      data-dragged={dragged ? '' : undefined}
      data-drop={dropPosition}
      style={{ '--greese-tree-row-depth': depth } as CSSProperties}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={(event: MouseEvent) => {
        event.stopPropagation()
        startRename()
      }}
    >
      {iconPosition === 'start' && icon}
      <span className="greese-HierarchicalList-label">
        {renaming ? (
          <Input
            ref={field}
            aria-label={`Rename ${name}`}
            className="greese-HierarchicalList-rename"
            value={draft}
            size="sm"
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => finish(true)}
            onKeyDown={onFieldKeyDown}
            onClick={(event: MouseEvent) => event.stopPropagation()}
          />
        ) : (
          name
        )}
      </span>
      {iconPosition === 'end' && icon}
    </div>
  )
}
