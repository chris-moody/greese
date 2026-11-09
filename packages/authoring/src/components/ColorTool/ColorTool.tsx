'use client'
import { useState, type CSSProperties, type JSX } from 'react'
import { cx, Popover } from '@greese/react'
import { SwapVerticalIcon } from '@greese/icons'
import { paintCss, type ComplexColorValue } from '../../core/paint/gradient.ts'
import { ComplexColorField } from '../Gradient/ComplexColorField.tsx'

export interface ColorToolProps {
  /** The paint new shapes are filled with: the front swatch. */
  primary: ComplexColorValue
  /** The paint new shapes are stroked with: the swatch behind. */
  secondary: ComplexColorValue
  /** Called with a new primary paint, from its picker. */
  onPrimaryChange: (value: ComplexColorValue) => void
  /** Called with a new secondary paint, from its picker. */
  onSecondaryChange: (value: ComplexColorValue) => void
  /** Called to swap the two: the arrows below the swatches. */
  onSwap: () => void
  /** Called to put both back to the editor's defaults: the small pair above. */
  onReset: () => void
  /** The primary's name, for its picker and its button. @default 'Fill' */
  primaryLabel?: string
  /** The secondary's name. @default 'Stroke' */
  secondaryLabel?: string
  /** Offers gradients in the pickers. @default true */
  allowGradient?: boolean
  /** Offers Current (`currentColor`) in the pickers: for SVG, as icons paint. */
  allowCurrentColor?: boolean
  /** Classes for the root. */
  className?: string
}

const describe = (value: ComplexColorValue): string =>
  value.type === 'none'
    ? 'none'
    : value.type === 'gradient'
      ? `${value.gradient.type} gradient`
      : value.color === 'currentColor'
        ? 'current color'
        : value.color

/**
 * The paint new shapes get, as Pixels has it at the foot of its tools: the
 * fill's swatch over the stroke's, each opening its picker (solid, gradient,
 * none, and with `allowCurrentColor` the text's color), with swap and reset
 * beside them. It holds no paint itself: the editor keeps both.
 *
 * ```tsx
 * <ColorTool primary={fill} secondary={stroke} onPrimaryChange={setFill} onSecondaryChange={setStroke} onSwap={swap} onReset={reset} />
 * ```
 */
export const ColorTool = ({
  primary,
  secondary,
  onPrimaryChange,
  onSecondaryChange,
  onSwap,
  onReset,
  primaryLabel = 'Fill',
  secondaryLabel = 'Stroke',
  allowGradient = true,
  allowCurrentColor,
  className,
}: ColorToolProps): JSX.Element => {
  const [editing, setEditing] = useState<'primary' | 'secondary' | null>(null)
  const swatch = (which: 'primary' | 'secondary') => {
    const value = which === 'primary' ? primary : secondary
    const label = which === 'primary' ? primaryLabel : secondaryLabel
    return (
      <button
        type="button"
        className="greese-ColorTool-swatch"
        data-which={which}
        data-none={value.type === 'none' || undefined}
        aria-label={`${label}: ${describe(value)}`}
        aria-haspopup="dialog"
        aria-expanded={editing === which}
        style={
          { '--greese-colortool-paint': paintCss(value) ?? undefined } as CSSProperties
        }
        onClick={() => setEditing(which)}
      />
    )
  }
  const label = editing === 'secondary' ? secondaryLabel : primaryLabel
  return (
    <div className={cx('greese-ColorTool', className)} role="group" aria-label="Colors">
      {swatch('secondary')}
      {swatch('primary')}
      <button
        type="button"
        className="greese-ColorTool-reset"
        aria-label="Reset colors"
        onClick={onReset}
      >
        <span />
        <span />
      </button>
      <button
        type="button"
        className="greese-ColorTool-swap"
        aria-label={`Swap ${primaryLabel.toLowerCase()} and ${secondaryLabel.toLowerCase()}`}
        onClick={onSwap}
      >
        <SwapVerticalIcon />
      </button>
      {/* Anchored to a box that never changes: the swatches swap their paint. */}
      <Popover
        className="greese-ColorTool-popover"
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        label={label}
        trigger={<span className="greese-ColorTool-anchor" aria-hidden="true" />}
      >
        {editing && (
          <ComplexColorField
            label={label}
            value={editing === 'primary' ? primary : secondary}
            onChange={editing === 'primary' ? onPrimaryChange : onSecondaryChange}
            allowNone
            allowGradient={allowGradient}
            allowCurrentColor={allowCurrentColor}
            inlinePicker
          />
        )}
      </Popover>
    </div>
  )
}
