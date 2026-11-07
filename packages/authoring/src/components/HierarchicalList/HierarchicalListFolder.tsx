'use client'
import type { JSX, MouseEvent } from 'react'
import { IconButton } from '@greese/react'
import { FolderIcon, FolderOpenIcon } from '@greese/icons'
import type { TreeItemModel } from '../../core/types/tree.types.ts'
import type { HierarchicalListFolderProps } from './hierarchicalList.types.ts'
import { HierarchicalListItem } from './HierarchicalListItem.tsx'

/**
 * A `HierarchicalList` folder: a row with an open/close toggle, its children
 * below it while open. The list owns whether it's open (`open`, `onToggle`),
 * so the arrow keys and the toggle agree.
 *
 * ```tsx
 * <HierarchicalList
 *   label="Library"
 *   renderFolder={(data, props) => <HierarchicalListFolder data={data} {...props} />}
 *   {...list}
 * />
 * ```
 */
export const HierarchicalListFolder = <T extends TreeItemModel = TreeItemModel>({
  data,
  depth = 0,
  open = false,
  onToggle,
  renderChild,
  ...props
}: HierarchicalListFolderProps<T>): JSX.Element => {
  const children = data.children ?? []
  return (
    <>
      <HierarchicalListItem
        data={data}
        depth={depth}
        {...props}
        hasChildren
        collapsed={!open}
        icon={
          <IconButton
            className="greese-HierarchicalList-toggle"
            size="sm"
            label={open ? `Close ${data.name}` : `Open ${data.name}`}
            // The row's own aria-expanded says it to the tree; the button is
            // the pointer's way in, so it stays out of the Tab order.
            tabIndex={-1}
            onClick={(event: MouseEvent) => {
              event.stopPropagation()
              onToggle?.(data.id)
            }}
          >
            {open ? <FolderOpenIcon /> : <FolderIcon />}
          </IconButton>
        }
      />
      {open && children.length > 0 && (
        <div role="none">{children.map((child) => renderChild?.(child, depth + 1))}</div>
      )}
    </>
  )
}
