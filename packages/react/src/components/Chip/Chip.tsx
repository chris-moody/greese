'use client'
import type { ComponentPropsWithRef, JSX, MouseEvent, ReactNode } from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import { CloseGlyph } from '../../utils/glyphs.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { BrandTone } from '../../utils/tone.ts'

export type ChipTone =
  'neutral' | BrandTone | 'positive' | 'negative' | 'warning' | 'info'

export interface ChipProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The chip's text. */
  children: ReactNode
  /** Leading icon or avatar. */
  icon?: ReactNode
  /** Adds a remove button (e.g. a filter or a recipient). */
  onRemove?: () => void
  /** Accessible name for the remove button. @default `Remove ${children}` */
  removeLabel?: string
  /** Makes the chip a toggle (`aria-pressed`), e.g. a filter choice. */
  selectable?: boolean
  /**
   * Whether a `selectable` chip is on, when you control it. Pair with
   * `onSelectedChange`.
   */
  selected?: boolean
  /** Whether a `selectable` chip starts on, when it keeps its own state. */
  defaultSelected?: boolean
  /** Called with the new state when a `selectable` chip is toggled. */
  onSelectedChange?: (selected: boolean) => void
  /**
   * The chip's color: neutral, accent, a brand color (primary, secondary,
   * tertiary), positive, negative, warning or info. A plain chip is tinted
   * in it; a `selectable` one shows it when selected. Without it, chips are
   * plain and selected ones use `accent`.
   */
  tone?: ChipTone
}

/**
 * A compact label that can be removed or toggled: filters, tags, recipients.
 *
 * ```tsx
 * <Chip onRemove={() => drop(tag)}>{tag}</Chip>
 * <Chip selectable defaultSelected>In stock</Chip>
 * <Chip tone="secondary">Featured</Chip>
 * ```
 */
export const Chip = ({
  greese,
  children,
  icon,
  onRemove,
  removeLabel,
  selectable,
  selected: selectedProp,
  defaultSelected = false,
  onSelectedChange,
  tone,
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

  return withGreese(
    <span
      {...props}
      className={cx(
        'greese-Chip',
        tone && `greese-Chip--${tone}`,
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
    </span>,
    greese
  )
}
