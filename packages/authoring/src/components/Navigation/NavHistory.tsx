'use client'
import type { JSX, ReactNode } from 'react'
import { IconButton, Menu, MenuItem, Tooltip } from '@greese/react'
import { ArrowLeftIcon, HistoryIcon } from '@greese/icons'

/** A place the editor has been: a nav-trail entry, as the history menu shows it. */
export interface NavHistoryEntry {
  /** Its key in the menu. */
  id: string
  /** Its name in the menu. */
  label: string
  /** Drawn beside the name: its environment's icon. */
  icon?: ReactNode
}

export interface NavHistoryProps {
  /** Where the editor has been, oldest first: a nav-trail slice's `entries`. */
  entries: readonly NavHistoryEntry[]
  /** Called by Back: go to the entry before the last, and drop the last. */
  onBack: () => void
  /** Called with an entry's index when it's chosen from the menu. */
  onJump: (index: number) => void
  /** How many of the newest entries the menu lists. @default 30 */
  limit?: number
}

/**
 * Back and a history menu, at the start of a nav bar: the editor's own
 * trail of places (a `createNavTrailSlice`), not the browser's. Both are off
 * until there's somewhere to go back to.
 *
 * ```tsx
 * <NavHistory entries={entries} onBack={back} onJump={jumpTo} />
 * ```
 */
export const NavHistory = ({
  entries,
  onBack,
  onJump,
  limit = 30,
}: NavHistoryProps): JSX.Element => {
  const empty = entries.length === 0
  const rows = entries
    .map((entry, index) => ({ entry, index }))
    .slice(-limit)
    .reverse()

  return (
    <div className="greese-NavHistory">
      <Tooltip content="Back">
        <IconButton size="sm" label="Back" disabled={empty} onClick={onBack}>
          <ArrowLeftIcon />
        </IconButton>
      </Tooltip>
      {empty ? (
        <IconButton size="sm" label="History" disabled>
          <HistoryIcon />
        </IconButton>
      ) : (
        <Menu
          trigger={
            <IconButton size="sm" label="History">
              <HistoryIcon />
            </IconButton>
          }
        >
          {rows.map(({ entry, index }) => (
            <MenuItem key={entry.id} onSelect={() => onJump(index)}>
              {entry.icon}
              {entry.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </div>
  )
}
