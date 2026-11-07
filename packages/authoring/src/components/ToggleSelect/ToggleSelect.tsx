'use client'
import type { JSX, ReactNode } from 'react'
import { cx, Select, ToggleButton, Tooltip } from '@greese/react'

/** One choice in a ToggleSelect's list. */
export interface ToggleSelectOption {
  /** What `onChange` reports. */
  value: string
  /** Its name in the list. */
  label: string
}

export interface ToggleSelectProps {
  /** The toggle's name, shown as its tooltip: "Snap". */
  label: string
  /** The toggle's icon. */
  icon: ReactNode
  /** Whether it's on: the list only takes a choice while it is. */
  pressed: boolean
  /** Called to turn it on or off. */
  onPressedChange: (pressed: boolean) => void
  /** The chosen option's value. */
  value: string
  /** Called with a chosen option's value. */
  onChange: (value: string) => void
  /** The choices. */
  options: readonly ToggleSelectOption[]
  /** The list's accessible name. @default `${label} value` */
  selectLabel?: string
  /** Turns off both the toggle and the list. */
  disabled?: boolean
  /** The list under the toggle, or beside it for a header one row tall. @default 'vertical' */
  orientation?: 'vertical' | 'horizontal'
  /** Classes for the root. */
  className?: string
}

/**
 * A toggle over the setting it switches on: snapping, and to what. The
 * choice applies only while the toggle is pressed, so the list is off until
 * then. Sized for a dense header, like a timeline's.
 *
 * ```tsx
 * <ToggleSelect label="Snap" icon={<GridIcon />} pressed={snap} onPressedChange={setSnap}
 *   value={grid} onChange={setGrid} options={grids} />
 * ```
 */
export const ToggleSelect = ({
  label,
  icon,
  pressed,
  onPressedChange,
  value,
  onChange,
  options,
  selectLabel = `${label} value`,
  disabled,
  orientation = 'vertical',
  className,
}: ToggleSelectProps): JSX.Element => (
  <div
    className={cx(
      'greese-ToggleSelect',
      orientation === 'horizontal' && 'greese-ToggleSelect--horizontal',
      className
    )}
  >
    <Tooltip content={label}>
      <ToggleButton
        size="sm"
        aria-label={label}
        pressed={pressed}
        onPressedChange={onPressedChange}
        disabled={disabled}
      >
        {icon}
      </ToggleButton>
    </Tooltip>
    <Select
      size="xs"
      aria-label={selectLabel}
      value={value}
      disabled={disabled || !pressed}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  </div>
)
