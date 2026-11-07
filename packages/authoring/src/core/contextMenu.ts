/**
 * Where a context menu opens, from the `contextmenu` event that asks for it,
 * with the browser's own menu cancelled. A right-click opens at the pointer; the
 * keyboard (Shift+F10, the Menu key) fires the event with no pointer position,
 * so it opens at the corner of the element that has focus.
 *
 * ```tsx
 * <div onContextMenu={(e) => setAt(contextMenuPoint(e))} />
 * ```
 */
export const contextMenuPoint = (event: {
  clientX: number
  clientY: number
  currentTarget: EventTarget
  preventDefault(): void
}): { top: number; left: number } => {
  event.preventDefault()
  if (event.clientX || event.clientY) return { top: event.clientY, left: event.clientX }
  const box = (event.currentTarget as Element).getBoundingClientRect()
  return { top: box.bottom, left: box.left }
}
