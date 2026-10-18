import type { JSX, ReactNode } from 'react'
import { Hide, Show, type BreakpointBoundary } from '../Visibility/Visibility.tsx'

/** A non-breaking space: Break's default fallback. */
const NBSP = '\u00A0'

export interface BreakProps {
  /** Break the line from this breakpoint upward (inclusive). */
  above?: BreakpointBoundary
  /** Break the line below this breakpoint (exclusive). */
  below?: BreakpointBoundary
  /**
   * What renders between the siblings where the line doesn't break.
   *
   * - A non-breaking space (the default) separates the words and keeps them
   *   together: `Fast,<Break above="md" />everywhere` never wraps between them.
   * - `' '` separates them and lets the line wrap there as usual.
   * - `null` joins the siblings with nothing in between.
   * - Any text or element: a separator such as `' · '` or an icon.
   *
   * @default NBSP (U+00A0)
   */
  fallback?: ReactNode
}

/**
 * A line break that only applies within a viewport range, for headings and
 * short copy that should set differently on phones and desktops. CSS alone, so
 * server-component safe and free of layout shift.
 *
 * ```tsx
 * <Heading>
 *   Ship faster,<Break above="md" />on every screen
 * </Heading>
 * ```
 *
 * Both the `<br>` and the fallback are always in the DOM; the one that doesn't
 * apply is `display: none`, so screen readers announce the text once.
 */
export const Break = ({ above, below, fallback = NBSP }: BreakProps): JSX.Element => {
  if (!above && !below) return <br />
  return (
    <>
      <Show above={above} below={below} asChild>
        <br />
      </Show>
      {fallback != null && fallback !== false && (
        <Hide above={above} below={below} asChild>
          <span>{fallback}</span>
        </Hide>
      )}
    </>
  )
}
