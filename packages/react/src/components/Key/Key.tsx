import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface KeyProps extends GreeseProps, ComponentPropsWithRef<'kbd'> {
  /** Text size of the key: `sm`, `md` or `lg`. @default 'md' */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * A key on the keyboard, as a native `<kbd>`. Nest them for a shortcut, so
 * the whole combination is one piece of keyboard input.
 *
 * ```tsx
 * <Key><Key>⌘</Key> + <Key>K</Key></Key>
 * ```
 */
export const Key = ({
  greese,
  size = 'md',
  className,
  ...props
}: KeyProps): JSX.Element =>
  withGreese(
    <kbd {...props} className={cx('greese-Key', `greese-Key--${size}`, className)} />,
    greese
  )
