import { addContainerBreakpoints } from '@greese/react'

declare module '@greese/ui' {
  interface BreakpointKeys {
    panelsm: true
    panelmd: true
    panellg: true
  }
}

/**
 * Breakpoints for what's inside a panel, measured against the panel's body
 * rather than the viewport: a docked or floating panel is as wide as it's
 * dragged, whatever the window. They're keys beside the viewport's, so
 * Stack, Grid and AutoLayout take them in any responsive prop:
 *
 * ```tsx
 * <AutoLayoutItem size={{ xs: 12, panelsm: 6 }}>…</AutoLayoutItem>
 * ```
 *
 * Min-widths in px; `styles/_PanelGroup.scss` writes the same values, and a
 * test keeps the two equal. A panel's status bar names the one in effect
 * while it's resized.
 */
export const panelBreakpoints = { panelsm: 240, panelmd: 320, panellg: 480 } as const

export type PanelBreakpoint = keyof typeof panelBreakpoints

/** The container a panel's body is, which the panel breakpoints query. */
export const PANEL_CONTAINER = 'greese-panel'

/** The largest panel breakpoint a width meets, or `xs` below them all. */
export const panelBreakpointAt = (width: number): PanelBreakpoint | 'xs' => {
  let found: PanelBreakpoint | 'xs' = 'xs'
  for (const [key, min] of Object.entries(panelBreakpoints))
    if (width >= min) found = key as PanelBreakpoint
  return found
}

// Wherever a dock renders, resolveResponsive() writes the panel keys' classes.
addContainerBreakpoints(panelBreakpoints)
