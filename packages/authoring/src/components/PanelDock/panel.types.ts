import type { ComponentType, ReactNode } from 'react'
import type { PanelSlot } from '../../core/layoutTree.types.ts'

/** A panel an editor offers the dock: what it's called, what it renders, and where it starts. */
export interface PanelRegistrant extends PanelSlot {
  /** The tab's label, and the panel's accessible name. */
  title: string
  /** What the panel renders. It reads the store through the environment's hooks. */
  component: ComponentType
  /**
   * Custom tab content, in place of `title`: a label that follows state (the
   * active tool's name), or an info button.
   */
  renderTabContent?: (panelId: string) => ReactNode
  /** Whether the group can collapse to its tab row. @default true */
  collapsible?: boolean
  /**
   * Whether the body scrolls. Turn it off for a panel that scrolls itself (a
   * timeline). @default true
   */
  scrollable?: boolean
  /**
   * A toolbar-style panel: a slim drag bar instead of a tab row, no
   * collapsing, and it never joins a tab group.
   */
  headless?: boolean
  /** Where a `FREE` panel first floats, in workspace pixels. */
  x?: number
  y?: number
}
