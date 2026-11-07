/**
 * Serialization — forward-only conversion between store state and the
 * {@link AuthoringProject} document. Maps live in state by design, so we convert
 * `Map`/`Set` at this boundary. No migration chain or legacy readers — this is
 * new infrastructure with no persisted documents to support.
 */
import type { AuthoringStore } from '../state/createAuthoringStore.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import type { MediaConfig } from './media.types.ts'
import type { AuthoringLayer } from '../core/types/layer.types.ts'
import type { FrameBase } from '../core/types/frame.types.ts'
import {
  AUTHORING_SCHEMA_VERSION,
  type AuthoringProject,
} from '../core/types/project.types.ts'
import { layersActions } from '../state/layers.slice.ts'
import { libraryActions } from '../state/library.slice.ts'
import { playbackActions } from '../state/playback.slice.ts'
import { panelsActions, type SerializedPanels } from '../state/panels.slice.ts'

/** Read the store and produce a serializable project document. */
export const serializeProject = <
  L extends AuthoringLayer = AuthoringLayer,
  F extends FrameBase = FrameBase,
  P extends object = Record<string, unknown>,
>(
  store: AuthoringStore,
  config: MediaConfig<L, F, P>,
  meta: { id: string; name: string }
): AuthoringProject => {
  const state = store.getState() as AuthoringRootState
  return {
    schemaVersion: AUTHORING_SCHEMA_VERSION,
    id: meta.id,
    name: meta.name,
    mediaType: config.mediaType,
    timing: config.timing,
    layers: state.layers,
    library: state.library,
    playback: state.playback,
    editorLayout: {
      regionSplit: 0.4,
    },
    preferences: { snapToFrame: true, showLabels: true },
  }
}

/** Load a project document into the store, replacing current state. */
export const deserializeProject = (
  store: AuthoringStore,
  project: AuthoringProject
): void => {
  const dispatch = store.dispatch
  dispatch(layersActions.clearLayers())
  project.layers.layers.forEach((layer) => dispatch(layersActions.addLayer({ layer })))
  dispatch(layersActions.setRootOrder(project.layers.rootOrder))
  dispatch(layersActions.setSelection([...project.layers.selection]))

  project.library.assets.forEach((asset) => dispatch(libraryActions.addAsset(asset)))
  dispatch(libraryActions.setItemOrder(project.library.itemOrder))

  dispatch(playbackActions.setCurrentFrame(project.playback.currentFrame))
  dispatch(playbackActions.setLoop(project.playback.loop))
  dispatch(playbackActions.setSpeed(project.playback.speed))

  // Panel layout is loaded separately via the user's layout preset system
  // (users/{uid}/pixelsLayouts). We keep the cast available for any callers
  // that supply a legacy document with an embedded panels blob.
  const legacyPanels = (project.editorLayout as unknown as { panels?: unknown }).panels
  if (legacyPanels) dispatch(panelsActions.hydrate(legacyPanels as SerializedPanels))
}
