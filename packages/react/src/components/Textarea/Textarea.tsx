'use client'
import type { ComponentPropsWithRef, CSSProperties, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import type { ControlSize } from '../Button/Button.tsx'
import { useFieldControl } from '../Field/Field.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface TextareaProps extends GreeseProps, ComponentPropsWithRef<'textarea'> {
  /** @default 'md' */
  size?: ControlSize
  invalid?: boolean
  /**
   * Grow with the content (CSS `field-sizing`, no JS). Where unsupported, it
   * falls back to a manually resizable box. @default true
   */
  autosize?: boolean
  /** Cap on autosize growth, in lines. */
  maxRows?: number
}

/** A native `<textarea>`, Field-aware, that grows with its content. */
export const Textarea = ({
  greese,
  size = 'md',
  invalid,
  autosize = true,
  rows = 3,
  maxRows,
  className,
  style,
  id,
  required,
  disabled,
  'aria-describedby': describedBy,
  ...props
}: TextareaProps): JSX.Element => {
  const control = useFieldControl({
    id,
    invalid,
    required,
    disabled,
    'aria-describedby': describedBy,
  })
  return withGreese(
    <textarea
      {...props}
      {...control}
      rows={rows}
      className={cx(
        'greese-Textarea',
        `greese-Textarea--size-${size}`,
        autosize && 'greese-Textarea--autosize',
        className
      )}
      style={
        {
          '--greese-textarea-rows': rows,
          ...(maxRows && { '--greese-textarea-max-rows': maxRows }),
          ...style,
        } as CSSProperties
      }
    />,
    greese
  )
}
