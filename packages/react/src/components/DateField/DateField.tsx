'use client'
import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { TextField, type TextFieldProps } from '../TextField/TextField.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export type DateFieldType = 'date' | 'time' | 'datetime-local' | 'month' | 'week'

export interface DateFieldProps extends GreeseProps, Omit<TextFieldProps, 'type'> {
  /** Which native picker: a date, a time, both, a month or a week. @default 'date' */
  type?: DateFieldType
}

/**
 * A labelled native date or time input: the platform's own picker (wheels on
 * iOS, a calendar on Android and desktop), keyboard entry, locale-aware
 * display, and an ISO value (`2026-10-18`) in forms. `min`, `max` and `step`
 * work natively. The picker follows the color scheme.
 *
 * ```tsx
 * <DateField label="Start date" name="start" min="2026-01-01" required />
 * ```
 */
export const DateField = ({
  greese,
  type = 'date',
  className,
  ...props
}: DateFieldProps): JSX.Element =>
  withGreese(
    <TextField {...props} type={type} className={cx('greese-DateField', className)} />,
    greese
  )
