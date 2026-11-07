/**
 * A widget that handles Delete itself (a gradient stop, a layer row, the
 * level editor's points) marks its container with this attribute, so a
 * window-level Delete shortcut (the timeline's) leaves the key to it.
 */
export const OWNS_DELETE_KEY_ATTR = 'data-owns-delete-key'

/** Whether a key event's target is inside a widget that handles Delete itself. */
export const ownsDeleteKey = (target: EventTarget | null): boolean =>
  !!(target as Partial<Element> | null)?.closest?.(`[${OWNS_DELETE_KEY_ATTR}="true"]`)
