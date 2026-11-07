'use client'
import type { JSX, MouseEvent, ReactNode } from 'react'
import { IconButton, Stack, type SpaceValue } from '@greese/react'
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LockOpenIcon,
  VolumeIcon,
  VolumeOffIcon,
} from '@greese/icons'
import type { AuthoringLayer } from '../../core/types/layer.types.ts'
import { HierarchicalListItem } from '../HierarchicalList/HierarchicalListItem.tsx'
import type { HierarchicalListItemProps } from '../HierarchicalList/hierarchicalList.types.ts'

export interface LayerTreeItemProps extends HierarchicalListItemProps<AuthoringLayer> {
  /** Shows a visibility toggle, called with the layer's id. Without it, none (a sound layer can't hide). */
  onToggleHidden?: (id: string) => void
  /** Shows a lock toggle, called with the layer's id. */
  onToggleLocked?: (id: string) => void
  /** Shows a mute toggle, called with the layer's id (sound layers). */
  onToggleMuted?: (id: string) => void
  /** A system-owned layer: its lock shows, but can't be undone. */
  structural?: boolean
  /** Content before the toggles: a chevron for a layer that hosts tracks. */
  startAdornment?: ReactNode
  /** Content after the toggles: an "add child" button. */
  endAdornment?: ReactNode
  /** Which side of the name the toggles sit on. @default 'start' */
  iconPosition?: 'start' | 'end'
  /** The space between the toggles, a space token. @default '1' */
  iconGap?: SpaceValue
}

/**
 * A layer's row: its name, renamed in place, and its visibility, lock and
 * mute toggles. The toggles stay out of the Tab order, since the tree has one
 * tab stop; each is named for what it does and the layer it does it to.
 *
 * ```tsx
 * <LayerTree renderItem={(data, props) => <LayerTreeItem data={data} {...props} iconPosition="end" />} />
 * ```
 */
export const LayerTreeItem = ({
  data,
  onToggleHidden,
  onToggleLocked,
  onToggleMuted,
  structural,
  startAdornment,
  endAdornment,
  iconPosition = 'start',
  iconGap = '1',
  ...props
}: LayerTreeItemProps): JSX.Element => {
  const { id, name, hidden, locked, muted } = data
  const act = (toggle?: (id: string) => void) => (event: MouseEvent) => {
    event.stopPropagation()
    toggle?.(id)
  }

  return (
    <HierarchicalListItem
      data={data}
      {...props}
      iconPosition={iconPosition}
      icon={
        <Stack direction="row" gap={iconGap} className="greese-LayerTree-toggles">
          {startAdornment}
          {onToggleMuted && (
            <IconButton
              size="sm"
              tabIndex={-1}
              aria-pressed={!!muted}
              label={`Mute ${name}`}
              onClick={act(onToggleMuted)}
            >
              {muted ? <VolumeOffIcon /> : <VolumeIcon />}
            </IconButton>
          )}
          {onToggleHidden && (
            <IconButton
              size="sm"
              tabIndex={-1}
              aria-pressed={!!hidden}
              label={`Hide ${name}`}
              onClick={act(onToggleHidden)}
            >
              {hidden ? <EyeOffIcon /> : <EyeIcon />}
            </IconButton>
          )}
          {structural ? (
            <IconButton size="sm" tabIndex={-1} label={`${name} is locked`} disabled>
              <LockIcon />
            </IconButton>
          ) : (
            onToggleLocked && (
              <IconButton
                size="sm"
                tabIndex={-1}
                aria-pressed={!!locked}
                label={`Lock ${name}`}
                onClick={act(onToggleLocked)}
              >
                {locked ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            )
          )}
          {endAdornment}
        </Stack>
      }
    />
  )
}
