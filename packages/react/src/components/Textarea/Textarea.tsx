'use client'
import type { ComponentPropsWithRef, CSSProperties, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import type { ControlSize } from '../Button/Button.tsx'
import { useFieldControl } from '../Field/Field.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface TextareaProps extends GreeseProps, ComponentPropsWithRef<'textarea'> {
  /**
   * Padding and text size: `sm`, `md` or `lg`. Text stays at least 16px on touch
   * screens.
   * @default 'md'
   */
  size?: ControlSize
  /**
   * Marks it invalid (`aria-invalid`) and colors it as an error. A surrounding
   * Field's `error` sets it too.
   */
  invalid?: boolean
  /**
   * Grow with the content (CSS `field-sizing`, no JS). Where unsupported, it
   * falls back to a manually resizable box. @default true
   */
  autosize?: boolean
  /** Cap on autosize growth, in lines. */
  maxRows?: number
}

/**
 * A native `<textarea>`, Field-aware, that grows with its content, in a
 * styled frame like Input's (so a theme's field shape takes it too).
 * `className` and `style` go to the frame; every other prop (and `ref`) goes
 * to the textarea itself.
 *
 * ```tsx
 * <Field label="Message">
 *   <Textarea name="message" maxRows={8} />
 * </Field>
 * ```
 */
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
    <div
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
      data-invalid={control['aria-invalid']}
      data-disabled={control.disabled || undefined}
    >
      <textarea {...props} {...control} rows={rows} className="greese-Textarea-control" />
    </div>,
    greese
  )
}
