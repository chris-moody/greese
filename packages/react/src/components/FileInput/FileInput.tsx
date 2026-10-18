'use client'
import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import type { ControlSize } from '../Button/Button.tsx'
import { useFieldControl } from '../Field/Field.tsx'

export interface FileInputProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size'
> {
  /** @default 'md' */
  size?: ControlSize
  invalid?: boolean
}

/**
 * A native file input with its button styled to match: the platform file
 * picker (camera and photo library on phones), drag-and-drop where the
 * browser supports it, and the chosen file names shown natively.
 */
export const FileInput = ({
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
  return (
    <input
      {...props}
      {...control}
      type="file"
      className={cx('greese-FileInput', `greese-FileInput--size-${size}`, className)}
    />
  )
}
