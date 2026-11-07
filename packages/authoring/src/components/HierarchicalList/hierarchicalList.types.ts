import type {
  ComponentPropsWithRef,
  DragEventHandler,
  MouseEventHandler,
  ReactNode,
} from 'react'
import type { DropTargetPosition, TreeItemModel } from '../../core/types/tree.types.ts'

/**
 * Row interaction props injected by {@link HierarchicalList} into each rendered
 * item (drag/drop wiring + selection click + drop-indicator state). Kept
 * separate so custom item renderers can spread them straight onto the row.
 */
export interface RowRenderProps {
  /** Whether this row is being dragged: it dims. */
  dragged?: boolean
  /** Where a dragged row would land relative to this one: a line above or below, or inside. */
  dropPosition?: DropTargetPosition
  /** Whether the row can be dragged: structural rows can't. */
  draggable?: boolean
  /** Starts a drag of this row, and the selection with it. */
  onDragStart?: DragEventHandler<HTMLElement>
  /** Works out where a drag over this row would land. */
  onDragOver?: DragEventHandler<HTMLElement>
  /** Drops the dragged rows above, below or into this one. */
  onDrop?: DragEventHandler<HTMLElement>
  /** Ends a drag, dropped or not. */
  onDragEnd?: DragEventHandler<HTMLElement>
  /** Selects this row, with Shift and Cmd/Ctrl as modifiers. */
  onClick?: MouseEventHandler<HTMLElement>
  /** Opens a context menu for this row, when the renderer offers one. */
  onContextMenu?: MouseEventHandler<HTMLElement>
  /** True when this node has children — a plain (non-folder) node's own collapse affordance. */
  hasChildren?: boolean
  /** True while this node's children are hidden (any node with children, not just folders). */
  collapsed?: boolean
  /** Toggle this node's collapse state — same store-backed toggle a folder's chevron uses. */
  onToggleCollapsed?: (id: string) => void
  /** Disables the double-click-to-rename interaction (e.g. Sound Studio's auto-named layers). */
  disableRename?: boolean
  /** Whether this row takes Tab into the tree (roving focus): its `tabIndex` is 0, others -1. */
  focusable?: boolean
  /** The list asks this row to start renaming (F2, or a double-click). */
  renameRequested?: boolean
}

/** Props passed to a leaf list item renderer. */
export interface HierarchicalListItemProps<
  T extends TreeItemModel = TreeItemModel,
> extends RowRenderProps {
  /** The item this row shows. */
  data: T
  /** How deep the row is nested, from 0: its indent and `aria-level`. */
  depth?: number
  /** Called with the row's changes: a new name. */
  onUpdate?: (update: { id: string; updates: Partial<T> }) => void
  /** Tells the list which row is renaming, or null when renaming ends. */
  setRenameTarget?: (id: string | null) => void
  /** An icon beside the label. */
  icon?: ReactNode
  /** Which side of the label `icon` renders on. Defaults to `'start'` (existing behavior). */
  iconPosition?: 'start' | 'end'
}

/** Props passed to a folder renderer (a list item that can expand children). */
export interface HierarchicalListFolderProps<
  T extends TreeItemModel = TreeItemModel,
> extends HierarchicalListItemProps<T> {
  /** Whether the folder shows its children. */
  open?: boolean
  /** Renders one of the folder's children, at a depth. */
  renderChild?: (child: string, depth: number) => ReactNode
  /** Called with the folder's id to open or close it. */
  onToggle?: (id: string) => void
}

/**
 * Props for the reusable {@link HierarchicalList}. Panel-agnostic: the component
 * renders the scrollable tree plus an actions bar, and is wrapped by whatever
 * container (docking panel, dialog, sidebar) the consumer chooses.
 */
export interface HierarchicalListProps<
  T extends TreeItemModel = TreeItemModel,
  U extends HierarchicalListItemProps<T> = HierarchicalListItemProps<T>,
  V extends HierarchicalListFolderProps<T> = HierarchicalListFolderProps<T>,
> extends Omit<ComponentPropsWithRef<'div'>, 'onSelect' | 'onDrop' | 'children'> {
  /** The tree's accessible name: what it lists ("Layers", "Library"). */
  label: string
  /** Every item, by id. A folder or parent lists its children's ids in `children`. */
  items: Map<string, T>
  /** The top-level items' ids, in order. */
  itemOrder: string[]
  /** The selected items' ids. */
  selectedItems: Set<string>
  /** Called with changed items: a rename, or `parent`/`children` after a move into a folder. */
  onUpdate?: (updates: { id: string; updates: Partial<T> }[]) => void
  /** Called with the new top-level order after a drag or a delete. */
  onItemOrderChange?: (order: string[]) => void
  /** Called with the new selection: click, Shift-click (a range), Cmd/Ctrl-click (toggle), or the arrow keys. */
  onSelect?: (selectedIds: Set<string>) => void
  /** Shows an Add button in the actions bar, which calls this. */
  onAddItem?: () => void
  /** Shows a Delete button (and takes Delete/Backspace), called with the ids to remove, descendants included. */
  onDeleteItems?: (itemIds: string[]) => void
  /** Shows an Add folder button in the actions bar, which calls this. */
  onAddFolder?: () => void
  /** Shows an Import button in the actions bar, for content from outside the app (a file). */
  onImportItem?: () => void
  /** Renders a row; the default is `HierarchicalListItem`. Spread the props it gets onto your row. */
  renderItem?: (data: T, props?: U) => ReactNode
  /** Renders a folder row; the default is `HierarchicalListFolder`. */
  renderFolder?: (data: T, props?: V) => ReactNode
  /** Optional content rendered above the scrollable list (e.g. tool controls). */
  header?: ReactNode
  /** Render without an internal scroll area (defer scrolling to a parent, e.g. the timeline). */
  disableScroll?: boolean
  /** The ids of rows whose children are hidden, to control them; without it the list keeps its own, folders closed. */
  collapsedIds?: Set<string>
  /** Called with a row's id to show or hide its children: required to control `collapsedIds`. */
  onToggleCollapsed?: (id: string) => void
  /**
   * Disables double-click-to-rename — either for every row (`boolean`), or
   * per-row via a predicate (e.g. Sound Studio's folders stay renamable even
   * though every other Sound Studio row is auto-named).
   */
  disableRename?: boolean | ((item: T) => boolean)
  /**
   * Marks specific rows as system-owned: not draggable, and excluded from
   * keyboard/footer Delete (e.g. Sound Studio's "Main" master-bus row). Also
   * consulted by `LayerContextMenu` (via `MediaConfig.layerTypes[].structural`)
   * to hide Duplicate/Delete — that lookup happens at the media-config layer,
   * not here, since `HierarchicalList` itself has no `config` access.
   */
  isStructural?: (item: T) => boolean
  /**
   * Gates a drop: called with the dragged ids, the drop target item, and the
   * drop position, at the top of both the drag-over indicator and the actual
   * drop handler. Defaults to always-allowed (`true`) so every existing
   * caller is unaffected.
   */
  canDrop?: (draggedIds: string[], target: T, position: DropTargetPosition) => boolean
  /**
   * Accepts an external HTML5 drag whose dragged id(s) aren't present in this
   * list's own `items` (e.g. a library asset dragged in from a different
   * panel) — undefined by default, so lists that don't opt in see no behavior
   * change. Reads the id(s) from `dataTransfer` (every draggable row already
   * sets `itemId`/`selectedItems` on drag-start, so no source-side wiring is
   * needed) whether the drop lands on an existing row or the list's empty
   * space. Mirrors `TimelineFrames`'s `onExternalDrop`.
   */
  onExternalDrop?: (draggedIds: string[]) => void
  /**
   * When true, deleting a folder with children opens a confirmation dialog
   * ("Delete folder and N items?") before proceeding — using the same
   * cascading-descendant delete as a direct delete, so the count is accurate.
   */
  confirmNonEmptyFolderDelete?: boolean
  /**
   * When true, all items render at depth 0 (no indentation) regardless of
   * their position in the hierarchy. Children of collapsed layers are still
   * hidden. Use for the Animation tab's flat layer presentation.
   */
  flat?: boolean
  /**
   * When true, the actions bar uses `position: sticky; bottom: 0` so it
   * remains visible when the list is inside a parent scroll container
   * (e.g. the timeline's BodyScroll). Has no effect when the list manages
   * its own internal scroll.
   */
  stickyActions?: boolean
}
