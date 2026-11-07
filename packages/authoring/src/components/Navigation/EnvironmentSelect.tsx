'use client'
import type { JSX, ReactNode } from 'react'
import { Button, cx, Menu, MenuItem } from '@greese/react'
import { ChevronDownIcon } from '@greese/icons'
import { accentStyle } from './accent.ts'

/** One environment an editor can switch to. */
export interface EnvironmentOption<Id extends string = string> {
  /** What `onValueChange` reports. */
  value: Id
  /** Its name, in the trigger and the menu. */
  label: string
  /** Drawn beside the label, in the trigger and the menu. */
  icon?: ReactNode
  /** Its hue, an OKLCH hue in degrees: the trigger's outline takes it while it's current. */
  hue?: number
  /** Listed, but not selectable yet. */
  disabled?: boolean
}

export interface EnvironmentSelectProps<Id extends string = string> {
  /** The current environment, derived from the editor's state. */
  value: Id
  /** The environments to choose from. */
  options: readonly EnvironmentOption<Id>[]
  /** Called with a chosen environment's value. */
  onValueChange: (value: Id) => void
  /** The control's accessible name. @default 'Environment' */
  label?: string
  /** Classes for the trigger. */
  className?: string
}

/**
 * The environment picker at the end of an editor's nav bar. It's a menu,
 * not a form field: choosing one moves the editor somewhere, and a native
 * `<option>` can't hold the icon each environment shows. Its outline takes
 * the current environment's hue.
 *
 * ```tsx
 * <EnvironmentSelect value={env} options={environments} onValueChange={switchTo} />
 * ```
 */
export const EnvironmentSelect = <Id extends string = string>({
  value,
  options,
  onValueChange,
  label = 'Environment',
  className,
}: EnvironmentSelectProps<Id>): JSX.Element => {
  const current = options.find((option) => option.value === value)

  return (
    <Menu
      placement="bottom-end"
      trigger={
        <Button
          className={cx('greese-EnvironmentSelect', className)}
          style={accentStyle(current?.hue)}
          variant="outline"
          size="sm"
          aria-label={`${label}: ${current?.label ?? value}`}
          startIcon={current?.icon}
          endIcon={<ChevronDownIcon />}
        >
          {current?.label ?? value}
        </Button>
      }
    >
      {options.map((option) => (
        <MenuItem
          key={option.value}
          disabled={option.disabled}
          aria-current={option.value === value || undefined}
          onSelect={() => onValueChange(option.value)}
        >
          {option.icon}
          {option.label}
        </MenuItem>
      ))}
    </Menu>
  )
}
