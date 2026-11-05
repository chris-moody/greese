'use client'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { ColorRole } from '@greese/ui'
import { useColorScheme } from './useColorScheme.ts'

/**
 * A color role: one greese ships, or one a theme added through
 * `createTheme({ extend })`.
 */
export type TokenColorRole = ColorRole | (string & {})

/**
 * Resolved values for color tokens, for the one case that cannot use `var()`:
 * drawing to a `<canvas>`.
 *
 * Everywhere else a token is named in CSS and the browser resolves it, which
 * is the point of zero-runtime styling — nothing reads the palette in
 * JavaScript, and a scheme change re-paints without a re-render. A canvas has
 * no CSS: its 2D context wants a real color string like `rgb(0 0 0 / 0.6)`, so
 * the value has to be computed and handed over. (An `<svg>` does not need
 * this: `fill` and `stroke` take a `var()` directly.)
 *
 * Pass the bare role names — `'fg-muted'`, not `'--greese-color-fg-muted'`.
 * The result is a tuple in the same order, so it destructures without each
 * value widening, and it is stable between renders while the names and the
 * resolved values are unchanged — safe in an effect's dependency list.
 *
 * Values are read from a live element with `getComputedStyle`, so they are
 * whatever the cascade resolved at that point in the tree, including a
 * `ThemeProvider scheme` on an ancestor that a module constant could not see.
 * They are re-read when the color scheme changes.
 *
 * ```tsx
 * const canvas = useRef<HTMLCanvasElement>(null)
 * const [ink, paper] = useTokenColors(canvas, 'fg-muted', 'surface')
 *
 * useEffect(() => {
 *   const context = canvas.current?.getContext('2d')
 *   if (!context) return
 *   context.fillStyle = paper
 *   context.strokeStyle = ink
 * }, [ink, paper])
 * ```
 *
 * Before the first measurement every value is an empty string, which a canvas
 * context ignores rather than throwing. The effect runs before paint, so
 * nothing is drawn with them.
 */
export const useTokenColors = <const Roles extends readonly TokenColorRole[]>(
  /** An element to resolve against — any element in the subtree that matters. */
  ref: RefObject<Element | null>,
  ...roles: Roles
): { [Index in keyof Roles]: string } => {
  const { resolvedScheme } = useColorScheme()
  // `roles` is a fresh array every render, so the names are the dependency.
  const key = roles.join(',')
  const [resolved, setResolved] = useState('')
  const latest = useRef<readonly TokenColorRole[]>(roles)
  latest.current = roles

  // Measured in an effect, not during render: `getComputedStyle` reads layout,
  // and during render the element is not attached yet.
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const style = getComputedStyle(element)
    setResolved(
      latest.current
        .map((role) => style.getPropertyValue(`--greese-color-${role}`).trim())
        .join('\u0000')
    )
    // `ref` is stable; the names and the scheme are what change the answer.
  }, [ref, key, resolvedScheme])

  // The tuple is rebuilt only when the measurement itself changed, which is
  // what makes it safe to depend on. The cast is the one thing the compiler
  // can't be told: `split` returns a plain array.
  return useMemo(
    () =>
      (resolved ? resolved.split('\u0000') : latest.current.map(() => '')) as {
        [Index in keyof Roles]: string
      },
    [resolved]
  )
}
