/**
 * Tree primitives — the base model shared by every hierarchical entity in the
 * framework (layers, library assets, folder trees). The reusable
 * `HierarchicalList` component (extracted from pixels' `DnDListPanel`) renders
 * anything assignable to {@link TreeItemModel}.
 */

/** Minimal identity every stored object carries. */
export interface DataObjectModel {
  id: string
  name: string
}

/** A node in a hierarchical, drag-and-droppable list. */
export interface TreeItemModel extends DataObjectModel {
  /** Parent node id, or undefined at the root. */
  parent?: string
  /** Ordered child node ids (folders and nesting). */
  children?: string[]
  /** Whether this node is currently selected. */
  selected?: boolean
  /** Media/entity discriminant. */
  type?: string
  /** True while a delete animation is in flight. */
  removing?: boolean
}

/** Where a dragged item drops relative to a target. */
export enum DropTargetPosition {
  ABOVE = 'above',
  BELOW = 'below',
  INTO = 'into',
}

/**
 * Discriminant value marking a tree node as a folder. Media modules that reuse
 * their own item-type enum should map their folder value to this string.
 */
export const FOLDER_TYPE = 'folder'

/** True when a node is a folder (can contain children). */
export const isFolder = (item: Pick<TreeItemModel, 'type'>): boolean =>
  item.type === FOLDER_TYPE
