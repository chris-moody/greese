import type { FrameKind } from './frame.types.ts'

/**
 * What the framework knows about one kind of layer: its name and its rules.
 * A media's full layer type (with how to draw it) extends this.
 */
export interface LayerTypeInfo {
  /** The `layerType` its layers carry. */
  layerType: string
  /** Its name, for menus and new layers. */
  label: string
  /** The layer types a layer of this type may hold, for folders and containers. */
  allowedChildren?: string[]
  /**
   * A system-owned type: its rows can't be dragged, renamed, duplicated or
   * deleted, and its lock is permanent (Sound Studio's master bus).
   */
  structural?: boolean
  /**
   * What a click on an empty timeline row creates: a span with
   * `FrameKind.SPAN`, a keyframe otherwise.
   */
  defaultFrameKind?: FrameKind | string
}

/** An editor's configuration, which panels read from the environment. */
export interface AuthoringConfig {
  /** The kinds of layer the editor has; the first is what Add creates. */
  layerTypes: LayerTypeInfo[]
}
