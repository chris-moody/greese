'use client'
import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import type { ControlSize } from '../Button/Button.tsx'
import { useFieldControl } from '../Field/Field.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface FileInputProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  /** Height and text size: `sm`, `md` or `lg`. @default 'md' */
  size?: ControlSize
  /**
   * Marks it invalid (`aria-invalid`) and colors it as an error. A surrounding
   * Field's `error` sets it too.
   */
  invalid?: boolean
}

/**
 * A native file input with its button styled to match: the platform file
 * picker (camera and photo library on phones), drag-and-drop where the
 * browser supports it, and the chosen file names shown natively.
 *
 * ```tsx
 * <Field label="Receipt">
 *   <FileInput name="receipt" accept="image/*,.pdf" />
 * </Field>
 * ```
 */
export const FileInput = ({
  greese,
  size = 'md',
  invalid,
  className,
  id,
  required,
  disabled,
  'aria-describedby': describedBy,
  ...props
}: FileInputProps): JSX.Element => {
  const control = useFieldControl({
    id,
    invalid,
    required,
    disabled,
    'aria-describedby': describedBy,
  })
  return withGreese(
    <input
      {...props}
      {...control}
      type="file"
      className={cx('greese-FileInput', `greese-FileInput--size-${size}`, className)}
    />,
    greese
  )
}
