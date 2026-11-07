import {
  PlusSquareIcon as AddIcon,
  WandIcon as AutoFixHigh,
  SpeedIcon as Continuous,
  RefreshIcon as Live,
  BracketsIcon as Magnet,
  CircleFilledIcon as FiberManualRecord,
  TargetIcon as GpsFixedIcon,
  EarIcon as Hearing,
  MinusSquareIcon as RemoveIcon,
  LoopIcon as Loop,
  MusicNoteIcon as MusicNote,
  PauseIcon as Pause,
  PlayIcon as PlayArrow,
  RedoIcon,
  SkipBackIcon as SkipPrevious,
  TimelineIcon as TweenAllIcon,
  ContrastIcon as Compose,
  UndoIcon,
  ColumnsIcon as SubPulse,
  GridIcon as AddMeasureIcon,
  WidthFullIcon as LoopPulse,
  WidthNormalIcon as FramePulse,
  WidthWideIcon as MeasurePulse,
  ZoomInIcon as ZoomIn,
  ZoomOutIcon as ZoomOut,
} from '@greese/icons'
import { useCallback } from 'react'
import type { ReactNode, JSX } from 'react'
import { ButtonGroup, IconButton, ToggleButton, Tooltip } from '@greese/react'
import {
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { playbackActions } from '../../state/playback.slice.ts'
import { timelineActions } from '../../state/timeline.slice.ts'
import { recordingActions, RecordMode } from '../../state/recording.slice.ts'
import { temporalGuideActions } from '../../state/temporalGuide.slice.ts'
import { keyframeModeActions, KeyframeMode } from '../../state/keyframeMode.slice.ts'
import {
  selectActiveTemporalGuideLayers,
  selectActiveTimelineScope,
  selectBaseFrameCount,
  selectKeyframeMode,
  selectPlayback,
  selectRecording,
  selectSnapping,
} from '../../state/selectors.ts'
import { useHistory } from '../../hooks/useHistory.ts'
import { useTimelineEditing } from '../useTimelineEditing.ts'
import { useHoldRepeat } from '../../hooks/useHoldRepeat.ts'
import { PulseLayerId } from '../../core/timeline/resolutions/index.ts'
import { TimeDomain } from '../../core/types/resolution.types.ts'
import { useTimelineResolution } from '../useTimelineResolution.ts'
import { TimelineToolbar } from './TimelineToolbar.tsx'

const TEMPORAL_GUIDE_LAYERS: {
  layer: PulseLayerId
  label: string
  icon: ReactNode
  musicalOnly?: boolean
}[] = [
  {
    layer: PulseLayerId.beat,
    label: 'Beat pulse',
    icon: <MusicNote size="1.25rem" />,
    musicalOnly: true,
  },
  {
    layer: PulseLayerId.subdivision,
    label: 'Subdivision pulse',
    icon: <SubPulse size="1.25rem" />,
    musicalOnly: true,
  },
  {
    layer: PulseLayerId.frame,
    label: 'Frame pulse',
    icon: <FramePulse size="1.25rem" />,
  },
  {
    layer: PulseLayerId.measure,
    label: 'Measure pulse',
    icon: <MeasurePulse size="1.25rem" />,
    musicalOnly: true,
  },
  {
    layer: PulseLayerId.loop,
    label: 'Loop pulse',
    icon: <LoopPulse size="1.25rem" />,
  },
]

/**
 * Props for the {@link TimelineHeader} component, which renders transport controls,
 * record mode toggles, and timeline manipulation buttons (add/remove frame/measure).
 */
export interface TimelineHeaderProps {
  onZoomIn: () => void
  onZoomOut: () => void
  /**
   * Deprecated: use onAddFrame instead. Overrides the Add Frame button
   * (default appends a single frame unit).
   */
  onAddFrames?: () => void
  /**
   * Called when the user clicks the **Add Frame** button (first of three frame controls).
   *
   * **Animation shells** (NeoPixels, Armature): Append a single frame unit (e.g., 1/24th second at 24fps).
   *
   * **Musical shells** (Sound Studio): Append a single beat (one quarter note, TICKS_PER_QUARTER).
   *
   * If omitted, the button is hidden.
   */
  onAddFrame?: () => void
  /**
   * Called when the user clicks the **Remove Frame** button (second of three frame controls).
   *
   * **Animation shells**: Remove the last frame unit.
   *
   * **Musical shells**: Remove the last beat.
   *
   * Shells should clamp to a minimum duration (e.g., 1 frame or 1 beat) to prevent empty timelines.
   *
   * If omitted, the button is hidden.
   */
  onRemoveFrame?: () => void
  /**
   * Called when the user clicks the **Add Measure** button (third frame control, Sound Studio only).
   *
   * Appends a full measure according to the active time signature (e.g., 4 beats for 4/4, 3 beats for 3/4).
   *
   * **Only shown when provided**—animation shells omit this prop since measures aren't a native concept.
   */
  onAddMeasure?: () => void
  /**
   * Optional custom label for the Add Frame button tooltip/aria-label.
   *
   * Defaults to icon-only if omitted. Sound Studio sets this to "Add Beat".
   */
  addFrameLabel?: string
  /**
   * Optional custom label for the Remove Frame button tooltip/aria-label.
   *
   * Defaults to icon-only if omitted. Sound Studio sets this to "Remove Beat".
   */
  removeFrameLabel?: string
  /** Studio-supplied breadcrumb trail, rendered at the left edge before the spacer. */
  breadcrumbs?: ReactNode
  /** Studio-supplied skin/bone controls rendered before generic right-side UI. */
  skinControls?: ReactNode
  /** Studio-supplied controls, rendered right-aligned before the undo button. */
  rightUi?: ReactNode
  /** See `TimelineProps.hideRecording` — suppresses the Record controls regardless of `showRecording`. */
  hideRecording?: boolean
}

/** Transport controls + frame readout + zoom for the timeline. */
export const TimelineHeader = ({
  onZoomIn,
  onZoomOut,
  onAddFrames,
  onAddFrame,
  onRemoveFrame,
  onAddMeasure,
  addFrameLabel = 'Add frame',
  removeFrameLabel = 'Remove frame',
  breadcrumbs,
  skinControls,
  rightUi,
  hideRecording,
}: TimelineHeaderProps): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const { config } = useAuthoringEnvironment()
  const { playing, loop, currentFrame } = useAuthoringSelector(selectPlayback)
  const snapping = useAuthoringSelector(selectSnapping)
  const recording = useAuthoringSelector(selectRecording)
  const keyframeMode = useAuthoringSelector(selectKeyframeMode)
  const baseFrameCount = useAuthoringSelector(selectBaseFrameCount)
  const history = useHistory()
  const editing = useTimelineEditing()
  const showRecording = !hideRecording && !!config.timelineTools?.showRecording
  const showTemporalGuide = !!config.timelineTools?.showTemporalGuide
  const showTweenAll = !!config.timelineTools?.showTweenAll
  const resolution = useTimelineResolution()
  const activeScope = useAuthoringSelector(selectActiveTimelineScope)
  const activeGuideLayers = useAuthoringSelector(selectActiveTemporalGuideLayers)
  const availableGuideLayers = TEMPORAL_GUIDE_LAYERS.filter(
    (entry) => !entry.musicalOnly || resolution.domain === TimeDomain.Musical
  )
  const addFrame = useCallback(
    () =>
      onAddFrame
        ? onAddFrame()
        : onAddFrames
          ? onAddFrames()
          : dispatch(playbackActions.setFrameCount(baseFrameCount + 1)),
    [onAddFrame, onAddFrames, dispatch, baseFrameCount]
  )
  const removeFrame = useCallback(
    () =>
      onRemoveFrame
        ? onRemoveFrame()
        : dispatch(playbackActions.setFrameCount(Math.max(1, baseFrameCount - 1))),
    [onRemoveFrame, dispatch, baseFrameCount]
  )
  const holdToAddFrame = useHoldRepeat(addFrame)

  return (
    <div className={'greese-TimelineHeader-header'}>
      <TimelineToolbar />
      {breadcrumbs}
      <div className={'greese-TimelineHeader-spacer'} />
      {skinControls}
      {rightUi}
      <Tooltip content="Undo">
        <IconButton
          size="sm"
          variant="ghost"
          onClick={history.undo}
          disabled={!history.canUndo}
          label="Undo"
        >
          <UndoIcon size="1.25rem" />
        </IconButton>
      </Tooltip>
      <Tooltip content="Redo">
        <IconButton
          size="sm"
          variant="ghost"
          onClick={history.redo}
          disabled={!history.canRedo}
          label="Redo"
        >
          <RedoIcon size="1.25rem" />
        </IconButton>
      </Tooltip>
      <Tooltip content="Skip to start">
        <IconButton
          size="sm"
          variant="ghost"
          label="Skip to start"
          onClick={() => dispatch(playbackActions.setCurrentFrame(0))}
        >
          <SkipPrevious size="1.25rem" />
        </IconButton>
      </Tooltip>
      <Tooltip content={playing ? 'Pause' : 'Play'}>
        <IconButton
          size="sm"
          variant="ghost"
          label={playing ? 'Pause' : 'Play'}
          onClick={() =>
            dispatch(playing ? playbackActions.pause() : playbackActions.play())
          }
        >
          {playing ? <Pause size="1.25rem" /> : <PlayArrow size="1.25rem" />}
        </IconButton>
      </Tooltip>
      <Tooltip content="Loop">
        <ToggleButton
          size="sm"
          variant="ghost"
          // Named, not only tooltipped: Glop's had no accessible name.
          aria-label="Loop"
          pressed={loop}
          onPressedChange={() => dispatch(playbackActions.setLoop(!loop))}
        >
          <Loop size="1.25rem" />
        </ToggleButton>
      </Tooltip>
      <Tooltip content="Snapping">
        <ToggleButton
          size="sm"
          variant="ghost"
          // Named, not only tooltipped: Glop's had no accessible name.
          aria-label="Snapping"
          pressed={snapping}
          onPressedChange={() => dispatch(timelineActions.toggleSnapping())}
        >
          <Magnet size="1.25rem" />
        </ToggleButton>
      </Tooltip>

      <Tooltip content="Automatic keyframe mode">
        <ToggleButton
          size="sm"
          variant="ghost"
          // Named, not only tooltipped: Glop's had no accessible name.
          aria-label="Automatic keyframes"
          pressed={keyframeMode === KeyframeMode.AUTOMATIC}
          onPressedChange={() =>
            dispatch(
              keyframeModeActions.setKeyframeMode(
                keyframeMode === KeyframeMode.AUTOMATIC
                  ? KeyframeMode.MANUAL
                  : KeyframeMode.AUTOMATIC
              )
            )
          }
        >
          <GpsFixedIcon size="1.25rem" />
        </ToggleButton>
      </Tooltip>
      {showTweenAll && (
        <Tooltip content="Tween All: create a tween between every layer's keyframes bracketing the playhead">
          <IconButton
            size="sm"
            variant="ghost"
            onClick={() => editing.createTweenAllAtTick(currentFrame)}
            label="Tween All"
          >
            <TweenAllIcon size="1.25rem" />
          </IconButton>
        </Tooltip>
      )}
      {showRecording && (
        <Tooltip content="Record played notes to the timeline">
          <ToggleButton
            size="sm"
            variant="ghost"
            pressed={recording.enabled}
            onPressedChange={() =>
              dispatch(recordingActions.setRecordingEnabled(!recording.enabled))
            }
            aria-label="Record"
          >
            <FiberManualRecord
              size="1.25rem"
              color={recording.enabled ? 'var(--greese-color-negative)' : undefined}
            />
          </ToggleButton>
        </Tooltip>
      )}
      {showRecording && (
        <ButtonGroup attached aria-label="Record mode">
          <Tooltip content="Live: the transport clock runs">
            <ToggleButton
              size="sm"
              variant="ghost"
              aria-label="Live"
              pressed={recording.mode === RecordMode.live}
              onPressedChange={() =>
                dispatch(recordingActions.setRecordMode(RecordMode.live))
              }
            >
              <Live
                color={
                  recording.mode === RecordMode.live && recording.enabled
                    ? 'var(--greese-color-negative)'
                    : undefined
                }
                size="1.25rem"
              />
            </ToggleButton>
          </Tooltip>

          <Tooltip content="Continuous: ignores loop, adds measures as needed">
            <ToggleButton
              size="sm"
              variant="ghost"
              aria-label="Continuous"
              pressed={recording.mode === RecordMode.continuous}
              onPressedChange={() =>
                dispatch(recordingActions.setRecordMode(RecordMode.continuous))
              }
            >
              <Continuous
                color={
                  recording.mode === RecordMode.continuous && recording.enabled
                    ? 'var(--greese-color-negative)'
                    : undefined
                }
                size="1.25rem"
              />
            </ToggleButton>
          </Tooltip>
          <Tooltip content="Compose: nothing moves until you advance time">
            <ToggleButton
              size="sm"
              variant="ghost"
              aria-label="Compose"
              pressed={recording.mode === RecordMode.compose}
              onPressedChange={() =>
                dispatch(recordingActions.setRecordMode(RecordMode.compose))
              }
            >
              <Compose
                color={
                  recording.mode === RecordMode.compose && recording.enabled
                    ? 'var(--greese-color-negative)'
                    : undefined
                }
                size="1.25rem"
              />
            </ToggleButton>
          </Tooltip>
        </ButtonGroup>
      )}
      {showRecording && recording.mode === RecordMode.compose && (
        <Tooltip content="Audition: hear every placed note in context">
          <ToggleButton
            size="sm"
            variant="ghost"
            pressed={recording.auditionOnPlace}
            onPressedChange={() =>
              dispatch(recordingActions.setAuditionOnPlace(!recording.auditionOnPlace))
            }
            aria-label="Audition"
          >
            <Hearing
              size="1.25rem"
              color={
                recording.auditionOnPlace ? 'var(--greese-color-primary)' : undefined
              }
            />
          </ToggleButton>
        </Tooltip>
      )}
      {showRecording && (
        <Tooltip content="Auto Trim: snap recorded notes to the nearest note length">
          <ToggleButton
            size="sm"
            variant="ghost"
            pressed={recording.autoTrim}
            onPressedChange={() =>
              dispatch(recordingActions.setAutoTrim(!recording.autoTrim))
            }
            aria-label="Auto Trim"
          >
            <AutoFixHigh size="1.25rem" />
          </ToggleButton>
        </Tooltip>
      )}
      {showTemporalGuide && (
        <div className={'greese-TimelineHeader-temporalGuide'}>
          {availableGuideLayers.map(({ layer, label, icon }) => (
            <Tooltip key={layer} content={label}>
              <ToggleButton
                size="sm"
                variant="ghost"
                pressed={activeGuideLayers.includes(layer)}
                onPressedChange={() =>
                  dispatch(
                    temporalGuideActions.toggleLayer({
                      scope: activeScope,
                      layer,
                    })
                  )
                }
                aria-label={label}
              >
                {icon}
              </ToggleButton>
            </Tooltip>
          ))}
        </div>
      )}
      <Tooltip content={addFrameLabel}>
        <IconButton size="sm" variant="ghost" {...holdToAddFrame} label={addFrameLabel}>
          <AddIcon size="1.25rem" />
        </IconButton>
      </Tooltip>
      <Tooltip content={removeFrameLabel}>
        <IconButton
          size="sm"
          variant="ghost"
          onClick={removeFrame}
          label={removeFrameLabel}
        >
          <RemoveIcon size="1.25rem" />
        </IconButton>
      </Tooltip>
      {onAddMeasure && (
        <Tooltip content="Add measure">
          <IconButton
            size="sm"
            variant="ghost"
            onClick={onAddMeasure}
            label="Add measure"
          >
            <AddMeasureIcon size="1.25rem" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip content="Zoom out">
        <IconButton size="sm" variant="ghost" onClick={onZoomOut} label="Zoom out">
          <ZoomOut size="1.25rem" />
        </IconButton>
      </Tooltip>
      <Tooltip content="Zoom in">
        <IconButton size="sm" variant="ghost" onClick={onZoomIn} label="Zoom in">
          <ZoomIn size="1.25rem" />
        </IconButton>
      </Tooltip>
    </div>
  )
}
