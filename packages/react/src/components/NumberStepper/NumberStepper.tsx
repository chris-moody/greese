'use client'
import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { NumberField, type NumberFieldProps } from '../NumberField/NumberField.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface NumberStepperProps
  extends GreeseProps, Omit<NumberFieldProps, 'steppers' | 'greese'> {}

/**
 * A number with a minus at one end and a plus at the other: the quantity
 * picker shape, where the two directions are far enough apart to hit without
 * looking and the value sits between them.
 *
 * It is a `NumberField` throughout — same parsing, clamping, snapping and
 * keyboard (arrows step, Page Up/Down step by `largeStep`, Home/End jump to
 * `min`/`max`) — laid out differently. Prefer `NumberField` in a dense panel,
 * where its stacked carets cost a third of the width; prefer this where the
 * control is the thing on screen and the targets should be big.
 *
 * ```tsx
 * <NumberStepper label="Guests" min={1} max={12} defaultValue={2} />
 * ```
 */
export const NumberStepper = ({
  greese,
  className,
  ...props
}: NumberStepperProps): JSX.Element =>
  withGreese(
    <NumberField
      {...props}
      steppers="split"
      className={cx('greese-NumberStepper', className)}
    />,
    greese
  )
