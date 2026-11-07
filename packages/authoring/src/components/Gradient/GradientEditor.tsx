'use client'
import type { JSX } from 'react'
import { EditableField } from '@greese/react'
import {
  gradientDirection,
  withGradientDirection,
  withGradientType,
  type GradientFill,
} from '../../core/paint/gradient.ts'
import { PropertyGrid } from '../PropertyGrid/PropertyGrid.tsx'
import { GradientStopBar } from './GradientStopBar.tsx'

export interface GradientEditorProps {
  /** The gradient. */
  value: GradientFill
  /** Called with the changed gradient. */
  onChange: (value: GradientFill) => void
  /** Stops every change and dims it. */
  disabled?: boolean
}

const TYPES = [
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' },
]

/** A coordinate is a fraction of the shape's box, and may reach past it. */
const COORD = { type: 'number', step: 0.01, numDecimals: 3 } as const

/**
 * Edits a gradient: linear or radial, its stops, its direction (and a
 * radial's squash), and its points as fractions of the shape's box. Value in,
 * value out, with no store: a tool's defaults and a selected shape's fill use
 * the same editor.
 *
 * ```tsx
 * <GradientEditor value={gradient} onChange={setGradient} />
 * ```
 */
export const GradientEditor = ({
  value,
  onChange,
  disabled,
}: GradientEditorProps): JSX.Element => {
  const set = (patch: Partial<Record<string, number>>) =>
    onChange({ ...value, ...patch } as GradientFill)
  const coord = (label: string, key: string, at: number) => (
    <EditableField
      {...COORD}
      key={key}
      label={label}
      value={at}
      disabled={disabled}
      onValueChange={(next) => next !== null && set({ [key]: next })}
    />
  )

  return (
    <div className="greese-GradientEditor">
      <EditableField
        type="segmented"
        aria-label="Gradient type"
        options={TYPES}
        value={value.type}
        disabled={disabled}
        onValueChange={(type) =>
          onChange(withGradientType(value, type as GradientFill['type']))
        }
      />
      <GradientStopBar
        stops={value.stops}
        disabled={disabled}
        onChange={(stops) => onChange({ ...value, stops })}
      />
      <PropertyGrid columns={2}>
        <EditableField
          type="knob"
          label="Direction"
          value={gradientDirection(value)}
          disabled={disabled}
          onValueChange={(direction) => onChange(withGradientDirection(value, direction))}
        />
        {value.type === 'radial' && (
          <EditableField
            type="number"
            label="Squash"
            min={0.1}
            max={2}
            step={0.05}
            value={value.scaleY}
            disabled={disabled}
            onValueChange={(scaleY) => scaleY !== null && set({ scaleY })}
          />
        )}
      </PropertyGrid>
      <PropertyGrid columns={2}>
        {value.type === 'linear'
          ? [
              coord('Start X', 'x0', value.x0),
              coord('Start Y', 'y0', value.y0),
              coord('End X', 'x1', value.x1),
              coord('End Y', 'y1', value.y1),
            ]
          : [
              coord('Center X', 'cx', value.cx),
              coord('Center Y', 'cy', value.cy),
              coord('Outer X', 'outerCx', value.outerCx),
              coord('Outer Y', 'outerCy', value.outerCy),
              coord('Inner radius', 'innerRadius', value.innerRadius),
              coord('Outer radius', 'outerRadius', value.outerRadius),
            ]}
      </PropertyGrid>
    </div>
  )
}
