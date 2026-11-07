/**
 * Layers — the hierarchical, timeline-owning unit of an authoring project.
 *
 * A layer is plain data. Its *behavior* (icon, allowed children, render-object
 * factory, sampler, property schema) is described by a
 * {@link import('./media.types').LayerTypeDef} supplied by a media module —
 * composition, not inheritance.
 */
import type { TreeItemModel } from './tree.types.ts'
import type { LayerTimeline } from './frame.types.ts'

/**
 * Framework-level layer types. Media modules extend the effective set through
 * their config; `layerType` is stored as a string so unknown media types
 * round-trip through serialization untouched.
 */
export enum LayerType {
  FOLDER = 'folder',
}

/** A single layer in the scene graph. */
export interface AuthoringLayer<
  P extends object = Record<string, unknown>,
> extends TreeItemModel {
  /** Discriminant resolved against the media module's registered layer types. */
  layerType: LayerType | string
  hidden: boolean
  locked: boolean
  /** When true the layer's audio is silenced during timeline playback (Sound Studio). */
  muted?: boolean
  /** One timeline per layer (a single frame in timeline-less mode). */
  timeline: LayerTimeline
  /** Media-defined properties projected into the Properties panel. */
  properties: P
  /** Id of the render object on the stage. Invariant: equals `id`. */
  renderObjectId?: string
}

/**
 * Normalized layer store. Children live on `layer.children`; `rootOrder` holds
 * top-level ordering. Selection is a shared set (see selection architecture).
 */
export interface LayerStoreState {
  layers: Map<string, AuthoringLayer>
  rootOrder: string[]
  selection: Set<string>
  /** Folder ids whose children are collapsed (hidden in tree and timeline). */
  collapsed: Set<string>
}
