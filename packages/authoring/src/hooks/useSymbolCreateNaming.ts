'use client'
/**
 * Owns the "name" field's autofill bookkeeping for a symbol-create dialog —
 * shared by every "Add Symbol"-style call site (Armature's `SkinLibraryPanel`
 * — graphics/animations *and* rig-native poses/movements/skin-slot clips,
 * NeoPixels' `PixelsLibraryPanel`, and the generic `LibraryPanel`), which are
 * otherwise near-identical here. The name recomputes from the caller's own
 * `computeName` whenever the selected type changes, until the user types
 * into the field themselves — at which point it's treated as hand-typed and
 * further type changes leave it alone.
 */
import { useState } from 'react'

export interface SymbolCreateNaming<T extends string> {
  name: string
  /** Direct user edit — marks the name as hand-typed so later type changes stop overwriting it. */
  setName: (name: string) => void
  /** Call when the dialog opens: clears the "hand-typed" flag and seeds the name for the (possibly remembered) current type. */
  resetForOpen: (type: T | '') => void
  /** Call whenever the selected type changes: recomputes the autofill, unless the user has already hand-typed a name this dialog-open. */
  notifyTypeChanged: (type: T | '') => void
}

/**
 * `computeName` maps a host's own symbolType union to an auto-generated name
 * for that type — e.g. `(type) => nextLibrarySymbolName(type, assets)` for a
 * plain graphic/animation library asset, or a host's own `nextIndexedName`-
 * based convention for a non-`LibraryAsset` kind (Armature's poses/movements,
 * keyed off `rig.poseNames()`/`rig.animationNames()` instead of `assets`).
 * Return `''` for a type with no naming convention at all (e.g. Armature's
 * `skinSlotAnimation`, whose name is instead derived from the rig slot it's
 * linked to) — the name stays blank for that type, and the host's own JSX
 * decides whether to hide or disable the field.
 */
export const useSymbolCreateNaming = <T extends string>(
  computeName: (type: T) => string
): SymbolCreateNaming<T> => {
  const [name, setNameState] = useState('')
  const [edited, setEdited] = useState(false)

  const computeFor = (type: T | ''): string => (type ? computeName(type) : '')

  const resetForOpen = (type: T | ''): void => {
    setEdited(false)
    setNameState(computeFor(type))
  }

  const notifyTypeChanged = (type: T | ''): void => {
    if (edited) return
    setNameState(computeFor(type))
  }

  const setName = (next: string): void => {
    setEdited(true)
    setNameState(next)
  }

  return { name, setName, resetForOpen, notifyTypeChanged }
}
