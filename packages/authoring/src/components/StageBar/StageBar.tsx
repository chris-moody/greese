'use client'
import type { ComponentPropsWithRef, JSX } from 'react'
import {
  Button,
  cx,
  EditableField,
  IconButton,
  Select,
  Text,
  Tooltip,
} from '@greese/react'
import { FocusIcon, GridIcon } from '@greese/icons'
import { EditableSelect, unitOptions } from '../EditableSelect/EditableSelect.tsx'

/** Zoom presets, in percent. */
export const ZOOM_PRESETS = [10, 25, 50, 75, 100, 150, 200, 400]

const percent = (value: number) => `${value}%`

/** Grid interval presets, in pixels. */
export const GRID_INTERVAL_PRESETS = [1, 5, 10, 25, 50, 100]

export interface ZoomControlProps {
  /** The zoom, 1 for 100%. */
  zoom: number
  /** Called with a new zoom: 1.5 for 150%. */
  onZoomChange: (zoom: number) => void
  /** Called to put the view back at 100%, centered. */
  onResetView: () => void
}

/**
 * The zoom: type a percentage or pick a preset, and a button to reset the
 * view. Props and callbacks only, so any zoomable canvas can use it.
 *
 * ```tsx
 * <ZoomControl zoom={zoom} onZoomChange={setZoom} onResetView={reset} />
 * ```
 */
export const ZoomControl = ({
  zoom,
  onZoomChange,
  onResetView,
}: ZoomControlProps): JSX.Element => (
  <div className="greese-StageBar-group">
    <EditableSelect
      label="Zoom"
      className="greese-StageBar-value"
      value={Math.round(zoom * 100)}
      options={unitOptions(ZOOM_PRESETS, '%')}
      // Every value reads as a percentage, not only the presets: 137%.
      format={percent}
      onChange={(percent) => onZoomChange(Math.max(1, Math.min(10000, percent)) / 100)}
    />
    <Tooltip content="Reset view (100%, centered)" placement="bottom">
      <IconButton size="xs" label="Reset view" onClick={onResetView}>
        <FocusIcon />
      </IconButton>
    </Tooltip>
  </div>
)

export interface GridControlProps {
  /** Whether the grid shows: its button is pressed while it does. */
  showGrid: boolean
  /** Called to show or hide the grid. */
  onToggleGrid: () => void
  /** The grid's spacing, in pixels. */
  gridInterval: number
  /** Called with a new spacing. */
  onIntervalChange: (interval: number) => void
  /** The spacings offered. @default GRID_INTERVAL_PRESETS */
  intervalOptions?: readonly number[]
}

/**
 * The grid's toggle and spacing.
 *
 * ```tsx
 * <GridControl showGrid={on} onToggleGrid={toggle} gridInterval={10} onIntervalChange={setInterval} />
 * ```
 */
export const GridControl = ({
  showGrid,
  onToggleGrid,
  gridInterval,
  onIntervalChange,
  intervalOptions = GRID_INTERVAL_PRESETS,
}: GridControlProps): JSX.Element => (
  <div className="greese-StageBar-group">
    <Tooltip content={showGrid ? 'Hide grid' : 'Show grid'} placement="bottom">
      <IconButton
        size="xs"
        label="Grid"
        aria-pressed={showGrid}
        variant={showGrid ? 'soft' : 'ghost'}
        tone={showGrid ? 'primary' : 'neutral'}
        onClick={onToggleGrid}
      >
        <GridIcon />
      </IconButton>
    </Tooltip>
    <EditableSelect
      label="Grid spacing"
      className="greese-StageBar-value"
      value={gridInterval}
      options={unitOptions(intervalOptions, 'px')}
      onChange={onIntervalChange}
    />
  </div>
)

export interface StageColorControlProps {
  /** The stage's background color, as hex. */
  color: string
  /** Called with a new color. */
  onChange: (color: string) => void
}

/**
 * The stage's background color: a swatch that opens a picker.
 *
 * ```tsx
 * <StageColorControl color="#ffffff" onChange={setColor} />
 * ```
 */
export const StageColorControl = ({
  color,
  onChange,
}: StageColorControlProps): JSX.Element => (
  <EditableField
    className="greese-StageBar-color"
    type="color"
    label="Stage color"
    size="xs"
    value={color}
    onValueChange={(next) => next && onChange(next)}
  />
)

/** A saved panel layout to choose. */
export interface StageBarLayoutOption {
  /** What `onSelectLayout` reports. */
  id: string
  /** Its name in the list. */
  name: string
}

export interface LayoutBarProps {
  /** The layouts to choose from. */
  layouts: readonly StageBarLayoutOption[]
  /** The chosen layout's id. */
  activeLayoutId: string
  /** Called with a chosen layout's id. */
  onSelectLayout: (id: string) => void
  /** Called on Save, to keep the current arrangement as the chosen layout. */
  onSaveLayout: () => void
  /** Whether Save shows: the chosen layout is the user's own. */
  canSave: boolean
  /** Whether a save is in flight: Save is off meanwhile. */
  saving?: boolean
}

/**
 * The panel layout's chooser, and Save for the user's own layouts.
 *
 * ```tsx
 * <LayoutBar layouts={layouts} activeLayoutId={id} onSelectLayout={choose} onSaveLayout={save} canSave />
 * ```
 */
export const LayoutBar = ({
  layouts,
  activeLayoutId,
  onSelectLayout,
  onSaveLayout,
  canSave,
  saving,
}: LayoutBarProps): JSX.Element => (
  <div className="greese-StageBar-group">
    <Text variant="caption" tone="muted" aria-hidden="true">
      Layout
    </Text>
    <Select
      size="xs"
      aria-label="Panel layout"
      value={activeLayoutId}
      onChange={(event) => onSelectLayout(event.target.value)}
    >
      {layouts.map((layout) => (
        <option key={layout.id} value={layout.id}>
          {layout.name}
        </option>
      ))}
    </Select>
    {canSave && (
      <Button size="xs" variant="outline" onClick={onSaveLayout} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    )}
  </div>
)

export interface StageBarProps
  extends
    LayoutBarProps,
    ZoomControlProps,
    Omit<ComponentPropsWithRef<'div'>, 'children'> {}

/**
 * The stage's toolbar: zoom, then the layout chooser. A media puts it in the
 * stage's context bar (`MediaConfig.stageBarSlot`).
 *
 * ```tsx
 * <StageBar zoom={zoom} onZoomChange={setZoom} onResetView={reset} layouts={layouts}
 *   activeLayoutId={id} onSelectLayout={choose} onSaveLayout={save} canSave={false} />
 * ```
 */
export const StageBar = ({
  zoom,
  onZoomChange,
  onResetView,
  layouts,
  activeLayoutId,
  onSelectLayout,
  onSaveLayout,
  canSave,
  saving,
  className,
  ...props
}: StageBarProps): JSX.Element => (
  <div
    {...props}
    // A named group, not a toolbar: a toolbar promises arrow-key movement.
    role="group"
    aria-label="Stage controls"
    className={cx('greese-StageBar', className)}
  >
    <ZoomControl zoom={zoom} onZoomChange={onZoomChange} onResetView={onResetView} />
    <LayoutBar
      layouts={layouts}
      activeLayoutId={activeLayoutId}
      onSelectLayout={onSelectLayout}
      onSaveLayout={onSaveLayout}
      canSave={canSave}
      saving={saving}
    />
  </div>
)
