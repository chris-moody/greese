/**
 * A collapsed `Range` at a client point inside `root`: where a click puts the
 * caret in text that's about to become editable. Chromium and WebKit have
 * `caretRangeFromPoint`; Firefox has the standard `caretPositionFromPoint`,
 * which gives a node and an offset to build one from. `null` when neither
 * exists, or the point isn't in `root` (it moved, or the click was stale):
 * the caller falls back to its own default, such as the end of the text.
 */
export const caretRangeAt = (
  root: Node,
  point: { x: number; y: number }
): Range | null => {
  const doc = root.ownerDocument as
    | (Document & {
        caretRangeFromPoint?: (x: number, y: number) => Range | null
        caretPositionFromPoint?: (
          x: number,
          y: number
        ) => { offsetNode: Node; offset: number } | null
      })
    | null
  if (!doc) return null
  let range: Range | null = null
  if (doc.caretPositionFromPoint) {
    const position = doc.caretPositionFromPoint(point.x, point.y)
    if (position) {
      range = doc.createRange()
      range.setStart(position.offsetNode, position.offset)
      range.collapse(true)
    }
  } else if (doc.caretRangeFromPoint) {
    range = doc.caretRangeFromPoint(point.x, point.y)
  }
  return range && root.contains(range.startContainer) ? range : null
}
