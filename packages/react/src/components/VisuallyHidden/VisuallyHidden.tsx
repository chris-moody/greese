import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'

export type VisuallyHiddenProps = ComponentPropsWithRef<'span'>

/**
 * Hides content visually while keeping it available to screen readers — for
 * icon-only buttons, skip links, and extra context on terse labels.
 *
 * ```tsx
 * <button>
 *   <CloseIcon />
 *   <VisuallyHidden>Close</VisuallyHidden>
 * </button>
 * ```
 */
export const VisuallyHidden = ({
  className,
  ...props
}: VisuallyHiddenProps): JSX.Element => (
  <span className={cx('greese-VisuallyHidden', className)} {...props} />
)
