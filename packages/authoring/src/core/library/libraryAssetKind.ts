/**
 * Classifies a library asset as a graphic or an animation — shared by every
 * shell that organizes its library into Graphics/Animations folders
 * (Armature Studio's `skinLibraryTree.helpers.ts`, NeoPixels'
 * `neoPixelsLibraryTree.helpers.ts`).
 */
import type { LibraryAsset } from '../types/library.types.ts'

export enum LibraryAssetKind {
  Graphic = 'graphic',
  Animation = 'animation',
  Image = 'image',
}

/**
 * An asset's explicit `category` (set at creation time by a symbol-creation
 * dialog) is authoritative when present. A freshly-created symbol has empty
 * layers either way, so falling back to the frame-count heuristic below for
 * it would always read as `graphic` regardless of the type the user actually
 * chose — the bug this category check fixes. Only legacy assets with no
 * `category` (created before that field existed) fall through to the
 * single- vs multi-frame heuristic over the asset's own layer timelines.
 *
 * `category === 'image'` is checked alongside the other two explicit-category
 * branches, before the heuristic — an image asset has no `scene.layerState`
 * at all (nothing to open as a nested subview, see `LibraryAsset.image`'s own
 * doc comment), so it can never fall through to the heuristic branch by
 * accident; `category` must always be set to `'image'` at creation.
 */
export const classifyLibraryAsset = (asset: LibraryAsset): LibraryAssetKind => {
  if (asset.category === 'animation') return LibraryAssetKind.Animation
  if (asset.category === 'graphic') return LibraryAssetKind.Graphic
  if (asset.category === 'image') return LibraryAssetKind.Image
  const layers = asset.scene?.layerState.layers
  if (!layers) return LibraryAssetKind.Graphic
  const isAnimated = [...layers.values()].some(
    (layer) => layer.timeline.frames.length > 1
  )
  return isAnimated ? LibraryAssetKind.Animation : LibraryAssetKind.Graphic
}
