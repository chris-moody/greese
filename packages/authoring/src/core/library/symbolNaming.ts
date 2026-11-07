/**
 * Auto-generated names for new library symbols and placed instances —
 * shared by every shell's "Add Symbol" flow and `useCreateInstance`, so a
 * fresh symbol/instance never collides with an existing one and the
 * numbering stays consistent across shells. Mirrors the same
 * parse-existing-names-and-continue convention Armature Studio's own
 * `nextSkinClipName` (`skinLayerState.helpers.ts`) already uses for
 * skin-animation clips — that convention is deliberately untouched by this
 * file, since skin-slot/skin-clip identities aren't project-wide library
 * symbols.
 */
import type { LibraryAsset } from '../types/library.types.ts'
import type { AuthoringLayer } from '../types/layer.types.ts'
import { classifyLibraryAsset, type LibraryAssetKind } from './libraryAssetKind.ts'

/**
 * Next `{base}{N}` name — `N` continues from the highest existing index of
 * names starting with `base` (parsed from `existingNames`), not just a raw
 * count, so deleting/renaming never produces a collision. The core algorithm
 * behind `nextLibrarySymbolName` below, generic enough for any "auto-name a
 * newly created thing" flow that isn't a `LibraryAsset` — e.g. Armature
 * Studio's skin/palette/pose/movement creation (see `useSymbolCreateNaming`).
 */
export const nextIndexedName = (
  base: string,
  existingNames: Iterable<string>
): string => {
  let maxIndex = -1
  for (const name of existingNames) {
    if (!name.startsWith(base)) continue
    const n = Number(name.slice(base.length))
    if (Number.isInteger(n) && n > maxIndex) maxIndex = n
  }
  return `${base}${maxIndex + 1}`
}

/** Next `graphic{N}`/`animation{N}` name for a project-wide library asset — see {@link nextIndexedName}. */
export const nextLibrarySymbolName = (
  kind: LibraryAssetKind,
  assets: Map<string, LibraryAsset>
): string => {
  const base = (kind.at(0) ?? '').toLowerCase() + kind.substring(1)
  const names = [...assets.values()]
    .filter((a) => classifyLibraryAsset(a) === kind)
    .map((a) => a.name)
  return nextIndexedName(base, names)
}

/** Next `{symbolName}-i{N}` name for a placed instance — `N` continues from the highest existing index among instances of the same symbol already in this scene. */
export const nextInstanceName = (
  symbolName: string,
  layers: Map<string, AuthoringLayer>
): string => {
  const prefix = `${symbolName}-i`
  let maxIndex = -1
  for (const layer of layers.values()) {
    if (!layer.name.startsWith(prefix)) continue
    const n = Number(layer.name.slice(prefix.length))
    if (Number.isInteger(n) && n > maxIndex) maxIndex = n
  }
  return `${prefix}${maxIndex + 1}`
}
