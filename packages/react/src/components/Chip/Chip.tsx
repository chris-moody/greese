'use client'
import type { ComponentPropsWithRef, JSX, MouseEvent, ReactNode } from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import { CloseGlyph } from '../../utils/glyphs.tsx'

export interface ChipProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  children: ReactNode
  /** Leading icon or avatar. */
  icon?: ReactNode
  /** Adds a remove button (e.g. a filter or a recipient). */
  onRemove?: () => void
  /** Accessible name for the remove button. @default `Remove ${children}` */
  removeLabel?: string
  /** Makes the chip a toggle (`aria-pressed`), e.g. a filter choice. */
  selectable?: boolean
  selected?: boolean
  defaultSelected?: boolean
  onSelectedChange?: (selected: boolean) => void
}

/**
 * A compact label that can be removed or toggled: filters, tags, recipients.
 *
 * ```tsx
 * <Chip onRemove={() => drop(tag)}>{tag}</Chip>
 * <Chip selectable defaultSelected>In stock</Chip>
 * ```
 */
export const Chip = ({
  children,
  icon,
  onRemove,
  removeLabel,
  selectable,
  selected: selectedProp,
  defaultSelected = false,
  onSelectedChange,
  className,
  ...props
}: ChipProps): JSX.Element => {
  const [selected, setSelected] = useControllableState({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange: onSelectedChange,
  })

  const content = (
    <>
      {icon && (
        <span className="greese-Chip-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="greese-Chip-label">{children}</span>
    </>
  )

  return (
    <span
      {...props}
      className={cx(
        'greese-Chip',
        selectable && selected && 'greese-Chip--selected',
        className
      )}
    >
      {selectable ? (
        <button
          type="button"
          className="greese-Chip-toggle"
          aria-pressed={selected}
          onClick={() => setSelected((s) => !s)}
        >
          {content}
        </button>
      ) : (
        content
      )}
      {onRemove && (
        <button
          type="button"
          className="greese-Chip-remove"
          aria-label={
            removeLabel ?? `Remove ${typeof children === 'string' ? children : ''}`.trim()
          }
          onClick={(event: MouseEvent) => {
            event.stopPropagation()
            onRemove()
          }}
        >
          <CloseGlyph />
        </button>
      )}
    </span>
  )
}
