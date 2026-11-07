'use client'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type UIEvent,
  type JSX,
} from 'react'
import { LayerTree, type LayerTreeProps } from '../../components/LayerTree/LayerTree.tsx'
import {
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import {
  selectActiveTimeMode,
  selectActiveTimelineTool,
  selectFrameCount,
} from '../../state/selectors.ts'
import { TimelineToolId } from '../../state/timelineTools.slice.ts'
import { TimingMode } from '../../core/types/timing.types.ts'
import { nativeTimeModeForDomain } from '../../core/types/resolution.types.ts'
import { usePlaybackClock } from '../usePlaybackClock.ts'
import { usePulseClock } from '../usePulseClock.ts'
import { useTimelineKeymap } from '../useTimelineKeymap.ts'
import { useTimelineResolution } from '../useTimelineResolution.ts'
import { TimelineHeader } from '../TimelineHeader/TimelineHeader.tsx'
import {
  DEFAULT_FRAME_WIDTH,
  LABEL_WIDTH,
  MAX_FRAME_WIDTH,
  MIN_FRAME_WIDTH,
  ROW_HEIGHT,
  RULER_HEIGHT,
} from '../../core/constants.ts'
import { MIN_GRID_PX, pickLabelTier } from '../../core/timeline/rulerTiers.ts'
import { TimelineRuler } from './components/TimelineRuler.tsx'
import { TimelineFrames, type TimelineFramesProps } from './components/TimelineFrames.tsx'
import { TimelineMarkers } from './components/TimelineMarkers.tsx'
import { TimelineCursor } from './components/TimelineCursor.tsx'
import { TimelineCornerReadouts } from './components/TimelineCornerReadouts.tsx'
import { RateToolOverlay } from './tools/RateToolOverlay.tsx'
import { TimeSignatureOverlay } from './tools/TimeSignatureOverlay.tsx'
import { MarkerToolOverlay } from './tools/MarkerToolOverlay.tsx'
import { Playhead } from './components/Playhead.tsx'
import { PlaybackBoundHandle } from './components/PlaybackBoundHandle.tsx'
import { TimelinePulseOverlay } from './components/TimelinePulseOverlay.tsx'
import { PasteMappingDialog } from './components/PasteMappingDialog.tsx'
import { usePlayheadScrub } from './usePlayheadScrub.ts'
import { useFrameInteractions } from './useFrameInteractions.ts'
import { useMarkerInteractions } from './useMarkerInteractions.ts'

const WINDOW_BUFFER = 4
/** Zoom in/out multiplier per click. */
const ZOOM_STEP = 1.25

/**
 * Timeline — a fixed `TimelineHeader` (transport/zoom) over a single scroll
 * container holding a sticky layer-label column (corner controls + `LayerTree`)
 * and the frames column (sticky ruler, rows, playhead). One scroll container
 * keeps the tree and frames vertically in sync; the corner and ruler pin to the
 * top via CSS sticky (staying put vertically while scrolling naturally with the
 * frames horizontally — the playhead/marker tabs ride on the ruler). The host
 * panel must NOT scroll (`PanelRegistrant.scrollable: false`): `BodyScroll`'s
 * height is the region minus the header, and IT is the only scroller. Only the
 * frame columns inside the scroll window render (horizontal virtualization).
 */
export interface TimelineProps {
  /** When true, hides the add/delete/folder buttons in the layer tree (for bone trees). */
  hideLayerItemActions?: boolean
  /** When true, hides only the layer tree's "Add Layer" footer button (Delete/Add Folder remain). */
  hideAddLayerItem?: boolean
  /** When true, all layers render at depth 0 in the label column (no hierarchy indentation). */
  flatLayers?: boolean
  /** When true, suppresses the layer tree's mute toggle (mute is Sound Studio-only; other studios opt out). */
  hideMute?: boolean
  /**
   * Disables double-click-to-rename in the layer tree — either for every row
   * (`boolean`), or per-row via a predicate (e.g. Sound Studio's folders stay
   * renamable even though every other Sound Studio row is auto-named).
   */
  disableRename?: LayerTreeProps['disableRename']
  /**
   * Gates a drop in the layer tree: called with the dragged ids, the drop
   * target layer, and the drop position. Screen-dependent rules (e.g. Sound
   * Studio's Arrangement-vs-Loop-only restrictions) live here, supplied by
   * the shell.
   */
  canDrop?: LayerTreeProps['canDrop']
  /** When true, deleting a layer-tree folder with children opens a confirmation dialog first. */
  confirmNonEmptyFolderDelete?: boolean
  /** The rate the corner shows. @default the config's `timing.fps`, or `timing.bpm` */
  frameRate?: number
  /** The rate's units. @default 'fps', or 'bpm' for a musical timing */
  frameRateUnits?: string
  /**
   * Ticks-per-frame-grid-unit — how many real ticks one raw `FrameBase.frame`
   * increment represents (1000 for animation shells; 1 for tick-native shells
   * like Sound Studio). Defaults to 1 (today's behavior: `frameWidth` is
   * directly pixels-per-raw-unit).
   */
  resolution?: number
  /**
   * Zoom bounds and starting level, in pixels per tick. Defaults derive from
   * the frame-width constants (`DEFAULT/MIN/MAX_FRAME_WIDTH / resolution`) —
   * right for frame-grid shells, but tick-native shells (1 tick per grid unit)
   * must pass fractional values (e.g. Sound Studio's 0.1 px/tick ≈ 96px/beat)
   * or a single grid unit spans the whole viewport.
   */
  zoom?: { min?: number; max?: number; initial?: number }
  /** Appends a single frame unit (animation shells) or beat (musical shells). */
  onAddFrame?: () => void
  /** Removes the last frame/beat, clamped to a minimum of 1. */
  onRemoveFrame?: () => void
  /** Sound Studio only: appends a full measure per the active time signature. */
  onAddMeasure?: () => void
  /** Label for add frame/beat button tooltip. Defaults to 'Add frame'. */
  addFrameLabel?: string
  /** Label for remove frame/beat button tooltip. Defaults to 'Remove frame'. */
  removeFrameLabel?: string
  /**
   * Disables frame-cell selection (highlight + click/marquee cell dispatches) —
   * for shells like Sound Studio whose timeline only deals in spans.
   */
  disableCellSelection?: boolean
  /** Studio-supplied breadcrumb trail, rendered in the header before the spacer. */
  breadcrumbs?: ReactNode
  /** Studio-supplied skin/bone controls rendered before generic right-side UI. */
  skinControls?: ReactNode
  /** Studio-supplied header controls, rendered right-aligned before the undo button. */
  rightUi?: ReactNode
  /**
   * When true, suppresses the header's Record toggle/mode controls and the
   * Space-to-record keyboard shortcut regardless of `MediaConfig.timelineTools
   * .showRecording` — for shells where recording is only meaningful in some
   * screens (e.g. Sound Studio's Arrangement screen has no pitched-note rows
   * to record into).
   */
  hideRecording?: boolean
  /**
   * Optional custom layer-row renderer forwarded to `LayerTree`. Use this to
   * wrap `LayerTreeItem` with studio-specific decorators (e.g. Sound Studio's
   * activity-indicator border). Receives the full base-props set from the layer
   * controller (toggle handlers, context menu) merged with list interaction props.
   */
  renderItem?: LayerTreeProps['renderItem']
  /** Forwarded to `TimelineFrames` — see its doc comment. */
  onExternalDrop?: TimelineFramesProps['onExternalDrop']
}

export const Timeline = ({
  hideLayerItemActions,
  hideAddLayerItem,
  flatLayers,
  hideMute,
  disableRename,
  canDrop,
  confirmNonEmptyFolderDelete,
  frameRate: frameRateProp,
  frameRateUnits: frameRateUnitsProp,
  resolution = 1,
  zoom,
  onAddFrame,
  onRemoveFrame,
  onAddMeasure,
  addFrameLabel,
  removeFrameLabel,
  disableCellSelection,
  breadcrumbs,
  skinControls,
  rightUi,
  hideRecording,
  renderItem,
  onExternalDrop,
}: TimelineProps): JSX.Element => {
  usePlaybackClock()
  useTimelineKeymap(hideRecording)
  // A stable external-store handle — pulse activity re-renders only the leaf
  // consumers below (overlay, playhead echo), never this component.
  const pulseClock = usePulseClock()
  const { config } = useAuthoringEnvironment()
  // The editor's own rate unless the shell shows another: Glop's shells
  // always passed one, and without it the corner read "0 fps".
  const musical = config.timing.mode === TimingMode.BPM
  const frameRate =
    frameRateProp ?? (musical ? config.timing.bpm : config.timing.fps) ?? 0
  const frameRateUnits = frameRateUnitsProp ?? (musical ? 'bpm' : 'fps')
  const timelineResolution = useTimelineResolution()
  const storedTimeMode = useAuthoringSelector(selectActiveTimeMode)
  const timeMode = storedTimeMode ?? nativeTimeModeForDomain(timelineResolution.domain)
  // Zoom state is pixels-per-tick; `frameWidth` (pixels per raw frame-grid-unit,
  // what every other Timeline child still consumes) is a derived bridge value —
  // see TimelineProps.resolution.
  const minPixelsPerTick = zoom?.min ?? MIN_FRAME_WIDTH / resolution
  const maxPixelsPerTick = zoom?.max ?? MAX_FRAME_WIDTH / resolution
  const [pixelsPerTick, setPixelsPerTick] = useState(
    zoom?.initial ?? DEFAULT_FRAME_WIDTH / resolution
  )
  // A TPF edit changes how many ticks a frame unit spans — rescale the zoom so
  // the on-screen frame width (and everything positioned by it) stays put.
  const prevResolutionRef = useRef(resolution)
  useEffect(() => {
    const prev = prevResolutionRef.current
    prevResolutionRef.current = resolution
    if (prev !== resolution && prev > 0) {
      setPixelsPerTick((p) => (p * prev) / resolution)
    }
  }, [resolution])
  const frameWidth = pixelsPerTick * resolution
  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewport, setViewport] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const framesRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  // Whether the timeline context menu is open — freezes TimelineCursor in
  // place (see below) instead of letting it hide when the pointer leaves the
  // frames body for the menu's portal.
  const [menuOpen, setMenuOpen] = useState(false)

  // Multiplicative steps so zooming behaves the same at 0.05 px/tick (musical)
  // as at 14 px/tick (animation) — a flat ±2px step is a no-op at one scale and
  // a full-range jump at the other.
  const zoomIn = useCallback(
    () => setPixelsPerTick((p) => Math.min(maxPixelsPerTick, p * ZOOM_STEP)),
    [maxPixelsPerTick]
  )
  const zoomOut = useCallback(
    () => setPixelsPerTick((p) => Math.max(minPixelsPerTick, p / ZOOM_STEP)),
    [minPixelsPerTick]
  )

  const onScrubStart = usePlayheadScrub({
    frameWidth,
    containerRef: framesRef,
    scrollRef,
  })

  const interactions = useFrameInteractions(frameWidth, bodyRef, {
    disableCellSelection,
  })
  const markerInteractions = useMarkerInteractions(frameWidth, bodyRef)
  const activeTool = useAuthoringSelector(selectActiveTimelineTool)

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setScrollLeft(event.currentTarget.scrollLeft)
    setViewport(event.currentTarget.clientWidth)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => {
      setViewport(el.clientWidth)
      setViewportHeight(el.clientHeight)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    measure()
    return () => observer.disconnect()
  }, [])

  // Tool overlays (rate chart, time signature) are sized to the scroll
  // VIEWPORT (not the content) so their value axis normalizes to what's on
  // screen; vertical pinning is pure CSS via the `ToolOverlaySticky` slot.
  const chartHeight = Math.max(0, viewportHeight - RULER_HEIGHT)

  const count = useAuthoringSelector(selectFrameCount)
  const framesWidth = count * frameWidth

  const firstFrame = Math.max(0, Math.floor(scrollLeft / frameWidth) - WINDOW_BUFFER)
  const lastFrame = Math.min(
    count - 1,
    Math.ceil((scrollLeft + Math.max(viewport - LABEL_WIDTH, 0)) / frameWidth) +
      WINDOW_BUFFER
  )

  // Frame-grid lines at the finest snap tier that keeps ≥ MIN_GRID_PX spacing —
  // windowed like the ruler, positioned per point so non-uniform grids
  // (triplets, signature-varying bars) stay true to their ticks. Memoized so a
  // memo(TimelineFrames) boundary isn't defeated by a fresh array every render.
  const gridLineXs = useMemo(
    () =>
      pickLabelTier(
        timelineResolution.getSnapPoints(
          { startTick: firstFrame * resolution, endTick: lastFrame * resolution },
          pixelsPerTick
        ),
        pixelsPerTick,
        MIN_GRID_PX
      ).map((point) => point.tick * pixelsPerTick),
    [timelineResolution, firstFrame, lastFrame, resolution, pixelsPerTick]
  )

  return (
    <div
      className={'greese-Timeline'}
      /*
       * The shared layout constants, handed to the stylesheets. Every
       * stylesheet in this family reads them, including through `calc()`
       * for the row proportions, so they are set once here on the root rather
       * than written down a second time in CSS. They are inherited custom
       * properties, so the ruler, rows and markers all see them wherever they
       * sit in the tree.
       *
       * Load-bearing: an undefined custom property is invalid at
       * computed-value time, which deletes the whole declaration — a missing
       * `--row-height` would leave the frame rows with no height at all, and
       * nothing would report it.
       */
      style={
        {
          '--greese-timeline-row-height': `${ROW_HEIGHT}px`,
          '--greese-timeline-label-width': `${LABEL_WIDTH}px`,
          '--greese-timeline-ruler-height': `${RULER_HEIGHT}px`,
        } as CSSProperties
      }
    >
      <div className={'greese-Timeline-tools'}>
        <TimelineHeader
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onAddFrame={onAddFrame}
          onRemoveFrame={onRemoveFrame}
          onAddMeasure={onAddMeasure}
          addFrameLabel={addFrameLabel}
          removeFrameLabel={removeFrameLabel}
          breadcrumbs={breadcrumbs}
          skinControls={skinControls}
          rightUi={rightUi}
          hideRecording={hideRecording}
        />
      </div>
      <div
        className={'greese-Timeline-bodyScroll'}
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div className={'greese-Timeline-bodyRow'}>
          <div className={'greese-Timeline-labelColumn'}>
            <div className={'greese-Timeline-labelCorner'}>
              <TimelineCornerReadouts
                frameRate={frameRate}
                frameRateUnits={frameRateUnits}
                timeMode={timeMode}
                timelineResolution={timelineResolution}
                count={count}
                showTimeSignature={config.timelineTools?.showTimeSignature}
              />
            </div>
            <LayerTree
              disableScroll
              hideItemActions={hideLayerItemActions}
              hideAddItem={hideAddLayerItem}
              flat={flatLayers}
              hideMute={hideMute}
              disableRename={disableRename}
              canDrop={canDrop}
              confirmNonEmptyFolderDelete={confirmNonEmptyFolderDelete}
              renderItem={renderItem}
            />
          </div>
          <div
            className={'greese-Timeline-framesColumn'}
            ref={framesRef}
            style={{ width: framesWidth }}
          >
            <TimelineRuler
              frameWidth={frameWidth}
              pixelsPerTick={pixelsPerTick}
              ticksPerUnit={resolution}
              resolution={timelineResolution}
              timeMode={timeMode}
              firstFrame={firstFrame}
              lastFrame={lastFrame}
              onScrubStart={onScrubStart}
              onDoubleClick={markerInteractions.onSurfaceDoubleClick}
            />
            {/* In flow right below the ruler: the zero-height sticky slot pins
                the tool overlays vertically while the rows scroll beneath. */}
            {(activeTool === TimelineToolId.rate ||
              (activeTool === TimelineToolId.timeSignature &&
                config.timelineTools?.showTimeSignature)) && (
              <div className={'greese-Timeline-toolOverlaySticky'}>
                {activeTool === TimelineToolId.rate ? (
                  <RateToolOverlay
                    width={framesWidth}
                    height={chartHeight}
                    scrollLeft={scrollLeft}
                    pixelsPerTick={pixelsPerTick}
                  />
                ) : (
                  <TimeSignatureOverlay
                    width={framesWidth}
                    height={chartHeight}
                    pixelsPerTick={pixelsPerTick}
                    ticksPerUnit={resolution}
                  />
                )}
              </div>
            )}
            <TimelineFrames
              frameWidth={frameWidth}
              gridLineXs={gridLineXs}
              disableCellSelection={disableCellSelection}
              bodyRef={bodyRef}
              interactions={interactions}
              onExternalDrop={onExternalDrop}
              onMenuOpenChange={setMenuOpen}
            />
            {activeTool === TimelineToolId.marker && (
              <MarkerToolOverlay
                width={framesWidth}
                frameWidth={frameWidth}
                interactions={markerInteractions}
              />
            )}
            <TimelineMarkers frameWidth={frameWidth} interactions={markerInteractions} />
            <TimelineCursor
              bodyRef={bodyRef}
              pixelsPerTick={pixelsPerTick}
              resolution={timelineResolution}
              hidden={
                !!(
                  interactions.marquee ||
                  interactions.drag ||
                  interactions.resize ||
                  interactions.spanDraft
                )
              }
              frozen={menuOpen}
            />
            <TimelinePulseOverlay pixelsPerTick={pixelsPerTick} pulseClock={pulseClock} />
            <Playhead
              frameWidth={frameWidth}
              onScrubStart={onScrubStart}
              pulseClock={pulseClock}
            />
            <PlaybackBoundHandle side="start" frameWidth={frameWidth} />
            <PlaybackBoundHandle side="end" frameWidth={frameWidth} />
          </div>
        </div>
      </div>
      <PasteMappingDialog />
    </div>
  )
}
