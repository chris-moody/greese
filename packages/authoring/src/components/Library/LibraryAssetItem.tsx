'use client'
import type { JSX, MouseEvent } from 'react'
import { IconButton, Tooltip } from '@greese/react'
import { ExternalLinkIcon } from '@greese/icons'
import type { LibraryAsset } from '../../core/types/library.types.ts'
import { HierarchicalListItem } from '../HierarchicalList/HierarchicalListItem.tsx'
import type { HierarchicalListItemProps } from '../HierarchicalList/hierarchicalList.types.ts'

export interface LibraryAssetItemProps extends HierarchicalListItemProps<LibraryAsset> {
  /** Called with the asset's id to open it in its own subview. */
  onOpen?: (id: string) => void
}

/**
 * A library asset's row: its name, renamed in place, and an Open button that
 * edits the asset in its own subview. The button stays out of the Tab order;
 * Enter on the focused row isn't Open, so the button is the way in.
 *
 * ```tsx
 * <LibraryAssetItem data={asset} onOpen={(id) => openAsset(id)} />
 * ```
 */
export const LibraryAssetItem = ({
  data,
  onOpen,
  ...props
}: LibraryAssetItemProps): JSX.Element => (
  <HierarchicalListItem
    data={data}
    {...props}
    iconPosition="end"
    icon={
      <Tooltip content="Open" placement="bottom">
        <IconButton
          className="greese-LibraryPanel-open"
          size="sm"
          tabIndex={-1}
          label={`Open ${data.name}`}
          onClick={(event: MouseEvent) => {
            event.stopPropagation()
            onOpen?.(data.id)
          }}
        >
          <ExternalLinkIcon />
        </IconButton>
      </Tooltip>
    }
  />
)
