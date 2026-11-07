/**
 * Project — the single serializable root document of an authoring environment.
 * Media-agnostic: it references media only by {@link MediaType} and stores the
 * normalized layer/library/playback/layout state that every editor shares.
 */
import type { TimingConfig } from './timing.types.ts'
import type { LayerStoreState } from './layer.types.ts'
import type { LibraryStoreState } from './library.types.ts'
import type { PlaybackState } from './playback.types.ts'

/**
 * Media discriminant. Framework ships none; each media module contributes a
 * value (armature, graphics, daw, …). Stored as a string so unknown media
 * round-trips through serialization.
 */
export type MediaType = string

/** Docking + region-split layout state persisted with the project. */
export interface DockLayoutState {
  /** Vertical split ratio between the timeline region and the stage (0..1). */
  regionSplit: number
  // Panel layout is no longer stored in the project document — it lives in
  // users/{uid}/pixelsLayouts so the arrangement is per-user across all projects.
}

/** User-facing editor preferences persisted with the project. */
export interface EditorPreferences {
  snapToFrame: boolean
  showLabels: boolean
}

/** The serializable authoring document. */
export interface AuthoringProject {
  /** Forward version stamp for future schema evolution. */
  schemaVersion: number
  id: string
  name: string
  mediaType: MediaType
  timing: TimingConfig
  layers: LayerStoreState
  library: LibraryStoreState
  playback: PlaybackState
  editorLayout: DockLayoutState
  preferences: EditorPreferences
}

/** Current schema version emitted by serialization. */
export const AUTHORING_SCHEMA_VERSION = 1
