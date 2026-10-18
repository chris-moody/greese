import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface CodeProps extends ComponentPropsWithRef<'code'>, GreeseProps {
  /**
   * A scrollable code block (`<pre><code>`) instead of inline code. Blocks are
   * keyboard-focusable so they can be scrolled without a mouse.
   */
  block?: boolean
}

/** Inline code, or a code block with `block`. Bring your own syntax highlighting. */
export const Code = ({ block, className, greese, ...props }: CodeProps): JSX.Element =>
  withGreese(
    block ? (
      <pre className={cx('greese-Code', 'greese-Code--block', className)} tabIndex={0}>
        <code {...props} />
      </pre>
    ) : (
      <code {...props} className={cx('greese-Code', className)} />
    ),
    greese
  )
