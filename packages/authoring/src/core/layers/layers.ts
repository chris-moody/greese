// `uid`, not Redux Toolkit's `nanoid`: RTK's re-export loads immer at module
// scope, whose `process.env` checks crash bundles with no `process` global
// (Glop's HTML-export players), and this module must stay framework-free.
import { uid } from '../uid.ts'
import { FOLDER_TYPE } from '../types/tree.types.ts'
import {
  LayerType,
  type AuthoringLayer,
  type LayerStoreState,
} from '../types/layer.types.ts'

/** Default layer type id used when a media module supplies none. */
export const DEFAULT_LAYER_TYPE = 'layer'

/** A fresh, empty layer store (used to seed a new library asset's scene). */
export const emptyLayerState = (): LayerStoreState => ({
  layers: new Map(),
  rootOrder: [],
  selection: new Set(),
  collapsed: new Set(),
})

/** Build a new layer with framework defaults (empty timeline, visible, unlocked). */
export const makeLayer = (
  partial: Partial<AuthoringLayer> & { name: string }
): AuthoringLayer => ({
  id: uid(),
  layerType: DEFAULT_LAYER_TYPE,
  hidden: false,
  locked: false,
  timeline: { frames: [], tweens: [] },
  properties: {},
  removing: false,
  ...partial,
})

/** Build a new folder layer. */
export const makeFolder = (name: string): AuthoringLayer =>
  makeLayer({ name, type: FOLDER_TYPE, layerType: LayerType.FOLDER, children: [] })
