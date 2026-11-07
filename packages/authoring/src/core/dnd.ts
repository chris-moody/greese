/**
 * Drag-and-drop payloads. Two kinds of drag reach an editor: a list row
 * (`HierarchicalList`, identified by its own `dataTransfer` keys) and files
 * from the operating system (`dataTransfer.files`). They carry different
 * payloads, so each has its own reader. Both take React's and the DOM's drag
 * events alike.
 */

/** What these readers need of a drag event. */
export interface DropLike {
  dataTransfer: Pick<DataTransfer, 'getData' | 'files'> | null
}

/**
 * The ids a `HierarchicalList` drag carries: the row dragged, or every
 * selected row in a multi-row drag. Empty when the drag is something else.
 */
export const extractDraggedIds = (event: DropLike): string[] => {
  const data = event.dataTransfer
  if (!data) return []
  const selected = data.getData('selectedItems')
  let raw: unknown = [data.getData('itemId')]
  if (selected) {
    try {
      raw = JSON.parse(selected)
    } catch {
      // Another app's drag can use the same key for something else.
      return []
    }
  }
  return Array.isArray(raw)
    ? raw.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : []
}

const files = (event: DropLike): File[] => Array.from(event.dataTransfer?.files ?? [])

/** The image files of an operating-system drop; anything else in it is left out. */
export const extractDroppedImageFiles = (event: DropLike): File[] =>
  files(event).filter((file) => file.type.startsWith('image/'))

/**
 * The JSON files of a drop, by type or by a `.json` name: browsers disagree
 * on a JSON file's type (`application/json`, `text/plain`, or none).
 */
export const extractDroppedJsonFiles = (event: DropLike): File[] =>
  files(event).filter(
    (file) =>
      file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
  )

/**
 * The SVG files of a drop, by type or by an `.svg` name, for the same reason.
 * (Shaper imports these.)
 */
export const extractDroppedSvgFiles = (event: DropLike): File[] =>
  files(event).filter(
    (file) => file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
  )
