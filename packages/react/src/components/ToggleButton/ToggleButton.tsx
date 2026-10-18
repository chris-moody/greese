'use client'
import type { JSX, MouseEvent } from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import { Button, type ButtonProps } from '../Button/Button.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface ToggleButtonProps extends GreeseProps, Omit<ButtonProps, 'asChild'> {
  /** Controlled pressed state. */
  pressed?: boolean
  /** Initial pressed state when uncontrolled. */
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

/**
 * A button that stays on or off (`aria-pressed`), like Bold in a toolbar.
 * Group several in an attached ButtonGroup for a segmented control.
 */
export const ToggleButton = ({
  greese,
  pressed: pressedProp,
  defaultPressed = false,
  onPressedChange,
  variant = 'outline',
  tone = 'neutral',
  onClick,
  className,
  ...props
}: ToggleButtonProps): JSX.Element => {
  const [pressed, setPressed] = useControllableState({
    value: pressedProp,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  })
  return withGreese(
    <Button
      {...props}
      variant={variant}
      tone={tone}
      aria-pressed={pressed}
      className={cx('greese-ToggleButton', className)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) setPressed((p) => !p)
      }}
    />,
    greese
  )
}
