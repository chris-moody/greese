'use client'
import type { ComponentPropsWithRef, JSX, MouseEvent, ReactNode } from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface SwapProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** Shown while pressed. */
  on: ReactNode
  /** Shown while not pressed. */
  off: ReactNode
  /** The accessible name, for what it toggles ("Dark mode"); stays the same in both states. */
  label: string
  /** Whether it shows `on`, when you control it. Pair with `onPressedChange`. */
  pressed?: boolean
  /** Whether it starts showing `on`, when it keeps its own state. */
  defaultPressed?: boolean
  /** Called with the new state when it's pressed. */
  onPressedChange?: (pressed: boolean) => void
  /** How one gives way to the other. @default 'fade' */
  effect?: 'fade' | 'rotate' | 'flip'
}

/**
 * A toggle that swaps between two pieces of content, such as a sun and a
 * moon: an `aria-pressed` button with no frame of its own, so it fits in an
 * AppBar or around an icon.
 *
 * ```tsx
 * <Swap label="Dark mode" off={<SunIcon />} on={<MoonIcon />} effect="rotate" />
 * ```
 */
export const Swap = ({
  greese,
  on,
  off,
  label,
  pressed: pressedProp,
  defaultPressed = false,
  onPressedChange,
  effect = 'fade',
  className,
  onClick,
  ...props
}: SwapProps): JSX.Element => {
  const [pressed, setPressed] = useControllableState({
    value: pressedProp,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  })
  return withGreese(
    <button
      type="button"
      aria-label={label}
      {...props}
      aria-pressed={pressed}
      className={cx('greese-Swap', `greese-Swap--${effect}`, className)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) setPressed((p) => !p)
      }}
    >
      <span className="greese-Swap-on" aria-hidden="true">
        {on}
      </span>
      <span className="greese-Swap-off" aria-hidden="true">
        {off}
      </span>
    </button>,
    greese
  )
}
