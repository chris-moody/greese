/**
 * Library — reusable nested assets (poses/animations, symbols/components,
 * loops/patterns/instruments). An asset is a mini-project: it owns its own layer
 * state, so opening one launches a nested authoring subview.
 */
import type { TreeItemModel } from './tree.types.ts'
import type { LayerStoreState } from './layer.types.ts'

/** A reusable, nestable library asset. */
export interface LibraryAsset extends TreeItemModel {
  /** Tab category (e.g. symbol / pose / pattern). */
  category?: string
  /** The asset's own scene (recursive — assets can contain layers). */
  scene?: {
    layerState: LayerStoreState
  }
  /**
   * An image asset's own content — a reference into the chunked-image
   * Firestore subcollection (`imageId`, not a URL — see
   * `pixelsImage.service.ts`) plus its natural pixel dimensions. Distinct
   * from `scene`: an image asset has no nested layer state to open — it's
   * placed directly as an `ImageLayer` instance, never drilled into as a
   * subview.
   */
  image?: {
    imageId: string
    width: number
    height: number
  }
}

/** Normalized library store. */
export interface LibraryStoreState {
  assets: Map<string, LibraryAsset>
  itemOrder: string[]
  selection: Set<string>
}
