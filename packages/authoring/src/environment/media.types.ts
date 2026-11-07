/**
 * Media configuration — the declarative contract a media module supplies to
 * {@link import('../core/createAuthoringEnvironment').createAuthoringEnvironment}.
 * Implementing a new editor (Armature, Graphics, DAW, Particle, Tilemap …) is
 * ≈90% filling this object in; the factory composes everything shared.
 */
import type { ComponentType } from 'react'
import type { AuthoringLayer } from '../core/types/layer.types.ts'
import type { FrameBase, FrameKind, LayerTimeline } from '../core/types/frame.types.ts'
import type { TimingConfig, TimingModel } from '../core/types/timing.types.ts'
import type { TimelineResolution } from '../core/types/resolution.types.ts'
import type { MediaType } from '../core/types/project.types.ts'
import type { RenderObject, StageBackend } from '../core/stage/renderObject.types.ts'
import type { PanelRegistrant } from '../components/PanelDock/panel.types.ts'
import type { AuthoringStore } from '../state/createAuthoringStore.ts'
import type { AuthoringConfig, LayerTypeInfo } from '../core/types/config.types.ts'

/** Context handed to a media backend when the stage mounts. */
export interface StageMountContext {
  /** DOM node the backend renders into. */
  container: HTMLElement
  /** The environment's store — backends may subscribe to render from layer state. */
  store: AuthoringStore
}

/** One extra layer-context-menu item — see `MediaConfig.extraContextMenuActions`. */
export interface ContextMenuAction {
  /** React key — must be unique among the items one call returns. */
  key: string
  label: string
  onClick: () => void
  disabled?: boolean
}

/** A single editable property surfaced in the Properties panel. */
export interface PropertyField<P extends object = Record<string, unknown>> {
  key: keyof P & string
  label: string
  kind: 'number' | 'text' | 'boolean' | 'color'
}

/** Describes the behavior of one layer type (composition over inheritance). */
export interface LayerTypeDef<
  L extends AuthoringLayer = AuthoringLayer,
  F extends FrameBase = FrameBase,
> extends LayerTypeInfo {
  icon?: ComponentType
  /** Layer types allowed as children (for folders / containers). */
  allowedChildren?: string[]
  /**
   * Marks this layer type as system-owned: a row of this type cannot be
   * renamed, duplicated, or deleted via the layer context menu, and cannot be
   * dragged. Use for synthetic rows a media module manages itself (e.g. Sound
   * Studio's "Main" master-bus row) rather than user-authored content.
   */
  structural?: boolean
  /**
   * The kind of frame created by direct timeline interaction on this layer. When
   * set to {@link FrameKind.SPAN}, double-click and press-drag on an empty row
   * create a ranged span (click to start, hold to drag to size) instead of a
   * point keyframe, and keyframe/tween creation is suppressed. Defaults to
   * keyframe behavior when omitted.
   */
  defaultFrameKind?: FrameKind | string
  /**
   * Build the stage render object for a layer of this type. Return `undefined` to
   * render nothing (e.g. the layer has no visual, or its backing model is absent).
   */
  createRenderObject?(layer: L, stage: StageBackend): RenderObject | undefined
  /** Sample the layer's value at a frame (media-specific interpolation). */
  sample?(timeline: LayerTimeline<F>, frame: number): unknown
  /**
   * Sample the layer's value directly from its properties — for layers that
   * store their canonical value in `layer.properties` rather than the timeline
   * (e.g. graphics layers whose DrawStep[] lives in `properties.steps`).
   * Takes precedence over {@link sample} when both are defined.
   */
  sampleProperties?(layer: L): unknown
  /**
   * Capture the layer's *current live* value(s) when a keyframe is added, so a new
   * key preserves the object's present state (e.g. a bone's rotation, or a full
   * transform record) instead of a default. A `Record` keys multiple channels at
   * once. Called by the framework's add-keyframe flows.
   */
  captureValue?(layer: L, frame: number): number | Record<string, number> | undefined
  /** Property fields shown when a layer of this type is selected. */
  propertySchema?: PropertyField<L['properties']>[]
  /**
   * Renders a span's activity chart inside its `SpanBar` (see
   * `SpanActivityChart`) — a multiline tween/automation view or a note-row
   * plot, windowed by the span's own resolved clamp/scaleMode/loopCount/
   * loopDelay so what's drawn always matches what will actually play. Runs
   * inside the environment provider tree, so it's free to resolve doc-level
   * span config itself (the same way property-editor panels already do)
   * rather than the framework needing to know about it. Omit for layer types
   * with no span content worth charting.
   */
  renderSpanChart?: ComponentType<{
    layer: L
    frame: F & { duration: number }
    frameWidth: number
    height: number
  }>
}

/** Describes a media frame kind and (later) its inline editor. */
export interface FrameTypeDef<F extends FrameBase = FrameBase> {
  kind: string
  label: string
  create(frame: number): F
}

/** A registered tool (mirrors the pixels tool-registry shape). */
export type ToolRegistrant = [string, ComponentType<Record<string, unknown>>]

/**
 * The full media configuration. Generic over the layer (`L`), frame (`F`), and
 * property (`P`) types so identity flows through the store, selectors, and UI.
 */
export interface MediaConfig<
  L extends AuthoringLayer = AuthoringLayer,
  F extends FrameBase = FrameBase,
  P extends object = Record<string, unknown>,
> extends AuthoringConfig {
  mediaType: MediaType
  timing: TimingConfig
  /** Timeline-less mode: every layer has exactly one frame. */
  timelineless?: boolean
  /**
   * Framespan-only mode (e.g. the sound DAW): the timeline holds only
   * {@link FrameKind.SPAN} frames — no keyframes or tweens. Enables span-aware
   * selection, clipboard, and pointer interactions and swaps the timeline
   * context menu for span actions (Add Span / Add Span Fill).
   */
  spanOnly?: boolean
  /**
   * Hides every context-menu path that creates or converts to an *empty*
   * keyframe (`FrameKind.EMPTY` — a keyed "nothing here" placeholder): "Add
   * Empty Keyframe" and "Clear Keyframe". Media whose keyframes are always
   * meaningful values (e.g. Sound Studio's property-tween automation, where an
   * empty gap has no useful meaning) sets this to skip the concept entirely.
   */
  disableEmptyKeyframes?: boolean
  layerTypes: LayerTypeDef<L, F>[]
  frameTypes?: FrameTypeDef<F>[]
  tools?: ToolRegistrant[]
  panels?: PanelRegistrant[]
  propertySchema?: PropertyField<P>[]
  /** Optional custom clock (e.g. Web Audio time for a DAW). */
  timing_model?: TimingModel
  /**
   * Tick-space resolution for ruler/zoom/labeling/snapping. Additive — when
   * absent, `useTimelineResolution` derives a pass-through resolution from
   * `timing`/`timing_model` so environments that never set this keep compiling.
   */
  resolution?: TimelineResolution
  /**
   * Optional span start-tick quantization hook — called with a span's raw
   * frame (start tick) during creation-by-drag and edge-resize, and from any
   * "apply to selection" action a shell wires up (e.g. a context-menu item),
   * so all three stay in agreement about what "snapped" means. Absent = no
   * quantization (today's behavior, unchanged for every consumer that doesn't
   * set this — only Sound Studio does, for its note-grid start-align toggle).
   */
  snapSpanFrame?(frame: number): number
  /**
   * Optional span duration quantization hook — same call sites/rationale as
   * {@link snapSpanFrame}, for a span's length instead of its start. `frame`
   * is the span's (already-snapped, if applicable) start, in case a consumer's
   * grid is itself frame-dependent; Sound Studio's isn't, but the hook takes
   * it for symmetry/future-proofing. Absent = no quantization.
   */
  snapSpanDuration?(duration: number, frame: number): number
  /**
   * Timeline toolbar surface — which tools a shell exposes beyond the always-
   * present Frame/Marker tools, and how the rate tool is labeled.
   */
  timelineTools?: {
    /** Label for the rate tool (e.g. "Framerate", "Tempo"). Defaults to "Framerate". */
    rateLabel?: string
    /** Rate tool value bounds (e.g. FPS 1-120, BPM 20-999). Defaults to 1-960. */
    rateMin?: number
    rateMax?: number
    /** Show the Time Signature tool (Sound Studio only). */
    showTimeSignature?: boolean
    /** Show the Record / Auto Trim header toggles (stages that record onto the timeline). */
    showRecording?: boolean
    /**
     * Show the Temporal Guide layer-toggle group (beat/subdivision/measure/
     * frame/loop pulses) in the timeline header. Available in every shell that
     * sets this — the guide itself has zero `@beta/amp` dependency.
     */
    showTemporalGuide?: boolean
    /** Metronome mute/enable header toggle (Sound Studio only). */
    showMetronome?: boolean
    /**
     * Show the TweenAll tool — a header button (and matching context menu
     * item) that creates a tween on every layer's keyframe/poseframe bracket
     * spanning a tick (the playhead for the header tool, the right-clicked
     * frame for the context menu item). Opt in for shells with tween-bearing
     * layers (NeoPixels, Armature, Sound Studio's property-tween rows).
     */
    showTweenAll?: boolean
    /**
     * Intercepts Live/Step's Space-hold record-start, so a shell can run its own
     * count-in sweep before the transport actually starts. Called in place of the
     * keymap's own immediate `playbackActions.play()` dispatch; returning `false`
     * suppresses that dispatch (the shell calls `play()` itself when ready).
     * Returning `true`/`undefined`, or leaving this absent, preserves today's
     * immediate-play behavior exactly.
     */
    onSpaceRecordStart?: () => boolean
    /**
     * Called on the matching Space keyup/cancel, after `onSpaceRecordStart`
     * suppressed the immediate play — lets an in-flight count-in sweep cancel
     * itself. No-op when no sweep is in flight.
     */
    onSpaceRecordCancel?: () => void
  }
  /**
   * Optional provider for reference-backed frames (e.g. armature `poseFrame`s that
   * reference a named pose). When present, the timeline context menu shows a
   * cascading "{label}" submenu of `names()`; choosing one calls `add()` for the
   * targeted cells (the current cell selection, or the right-clicked frame).
   */
  frameRefProvider?: {
    label: string
    names(): string[]
    add(
      store: AuthoringStore,
      cells: { layerId: string; frame: number }[],
      name: string
    ): void
  }
  /**
   * Hide specific layer-context-menu actions for a given layer, beyond the
   * blanket `structural` guard — e.g. hiding "Duplicate" only in one screen
   * of a multi-screen shell (Sound Studio's Arrangement vs. Loop views share
   * one `LayerContextMenu`, but each screen hides a different action set).
   * Consulted per-row; defaults to hiding nothing when omitted.
   */
  hiddenContextMenuActions?(
    layer: L
  ): Set<'duplicate' | 'newLayer' | 'newFolder' | 'showHide' | 'lock' | 'paste'>
  /**
   * Extra layer-context-menu items beyond the shared built-in set (New Layer/
   * Folder, Duplicate, Show/Hide, Lock, Paste Into Layer, Delete) — e.g.
   * Pixels' Cut/Copy/Paste. Called per-row with the right-clicked layer and
   * the live store (not yet available at `MediaConfig`-build time, since the
   * store is created *from* this config); return an empty array for no extra
   * items. Rendered as a trailing group of `MenuItem`s, in array order.
   */
  extraContextMenuActions?(layer: L, store: AuthoringStore): ContextMenuAction[]
  /**
   * Mount a concrete rendering backend (e.g. the legacy `packages/pixels` Pixi
   * engine, since removed, built a Pixi stage; an armature editor a canvas).
   * Omit for headless/timeline-only editors. The
   * framework's {@link StageHost} calls this and drives selection through the
   * returned {@link StageBackend}.
   */
  createStage?(context: StageMountContext): StageBackend
  /**
   * Optional component rendered on the right side of the stage context bar
   * (ruler toggle is always present on the left). Use for media-specific UI such
   * as a layout-preset dropdown or active-tool display. Runs inside the
   * environment Provider so it can access the authoring store.
   */
  stageBarSlot?: ComponentType
}
