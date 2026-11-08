/**
 * The docking layout: a binary split tree, stored flat so it's JSON-safe (it
 * is persisted in documents) and Immer drafts it without recursive types.
 * A split's `children` are node ids, not nested nodes.
 */

/** Where a docked panel sits by default, before the user moves it. `FREE` floats over the workspace. */
export enum PanelArea {
  LEFT = 'left',
  RIGHT = 'right',
  FREE = 'free',
}

/**
 * What the tree builders need to know about a panel. A full registrant (with
 * its component and title) is the React entry's `PanelRegistrant`, which
 * extends this.
 */
export interface PanelSlot {
  id: string
  area: PanelArea
  /** Sort order within its area, lowest first. */
  order?: number
}

/** The five drop zones on a leaf: center joins it as a tab, an edge splits it. */
export enum DropZone {
  Center = 'center',
  Top = 'top',
  Bottom = 'bottom',
  LeftSplit = 'left-split',
  RightSplit = 'right-split',
}

/** The stage's leaf. It can't be dragged, closed or joined as a tab; panels dock to its edges. */
export const RESERVED_STAGE_ID = '_stage_'

/** The timeline's leaf, with the same rules as the stage's. */
export const RESERVED_TIMELINE_ID = '_timeline_'

/** A tab group: one or more panels sharing a space. */
export interface ZoneLeaf {
  kind: 'leaf'
  id: string
  /** Panel ids shown as tabs, in order. */
  tabs: string[]
  /** The visible tab. */
  activeTab: string
  /** Whether the group is collapsed to its tab row. */
  collapsed: boolean
  /**
   * A toolbar-style group: a slim drag bar instead of tabs, no collapsing, and
   * it neither accepts nor joins tab drops.
   */
  headless?: boolean
}

/** Two nodes either side of a draggable divider. */
export interface ZoneSplit {
  kind: 'split'
  id: string
  /** `col` stacks the children top to bottom; `row` places them left to right. */
  orientation: 'col' | 'row'
  /** The two children's ids, primary first. */
  children: [string, string]
  /** The primary child's size in pixels, saved on every resize. */
  primarySize: number
  /**
   * Renders the primary at the end (right, or bottom) while the secondary
   * fills the start: a fixed-size right or bottom pane.
   */
  reversed?: boolean
}

export type ZoneNode = ZoneLeaf | ZoneSplit

/** The whole workspace: stage, timeline and panel leaves in one tree. */
export interface ZoneTree {
  rootId: string | null
  nodes: Record<string, ZoneNode>
}

/** A panel pulled out of the tree, floating over the workspace. */
export interface FloatingPanelState {
  id: string
  x: number
  y: number
  /** Width in pixels; 240 when absent. */
  width?: number
  /** Height in pixels; 320 when absent. */
  height?: number
}

/** Where a dragged panel would land. `null` floats it. */
export type DropTarget =
  | { kind: 'leaf'; leafId: string; zone: DropZone }
  /**
   * A place in a group's tab row: `index` counts the group's other tabs, so
   * 0 is first and their count is last.
   */
  | { kind: 'tab'; leafId: string; index: number }
  | { kind: 'container-edge'; edge: 'top' | 'bottom' | 'left' | 'right' }
  | null

/**
 * One child of a `row` or `col` spec. `size` is its fixed pixel size along the
 * split axis; the one child without a size fills the rest (the last child, if
 * every child has one).
 */
export interface LayoutSpecChild {
  spec: LayoutSpec
  size?: number
}

/**
 * A workspace's default shape, written as a nested literal and turned into a
 * {@link ZoneTree} by `buildFromSpec`. Children before the fill child become
 * left or top panes; children after it become right or bottom panes.
 *
 * ```ts
 * const layout: LayoutSpec = {
 *   kind: 'row',
 *   children: [
 *     { size: 220, spec: { kind: 'panel', id: 'layers' } },
 *     { spec: { kind: 'stage' } },
 *     { size: 260, spec: { kind: 'tabs', ids: ['properties', 'code'] } },
 *   ],
 * }
 * ```
 */
export type LayoutSpec =
  | { kind: 'stage' }
  | { kind: 'timeline' }
  | { kind: 'panel'; id: string; headless?: boolean }
  | { kind: 'tabs'; ids: string[]; activeId?: string; headless?: boolean }
  | { kind: 'row'; children: LayoutSpecChild[] }
  | { kind: 'col'; children: LayoutSpecChild[] }
