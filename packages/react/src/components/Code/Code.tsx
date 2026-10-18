import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'

export interface CodeProps extends ComponentPropsWithRef<'code'> {
  /**
   * A scrollable code block (`<pre><code>`) instead of inline code. Blocks are
   * keyboard-focusable so they can be scrolled without a mouse.
   */
  block?: boolean
}

/** Inline code, or a code block with `block`. Bring your own syntax highlighting. */
export const Code = ({ block, className, ...props }: CodeProps): JSX.Element =>
  block ? (
    <pre className={cx('sauce-Code', 'sauce-Code--block', className)} tabIndex={0}>
      <code {...props} />
    </pre>
  ) : (
    <code {...props} className={cx('sauce-Code', className)} />
  )
