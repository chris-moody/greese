'use client'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type DragEvent,
  type JSX,
  type ReactNode,
} from 'react'
import { cx } from '../../utils/cx.ts'
import { Button, type ControlSize } from '../Button/Button.tsx'
import { useFieldControl } from '../Field/Field.tsx'
import { composeRefs } from '../Slot/Slot.tsx'
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
  /** The button's text. @default 'Choose file' */
  buttonLabel?: ReactNode
  /** Shown beside the button until a file is chosen. @default 'No file chosen' */
  placeholder?: string
}

/** What the chosen files read as: the name of one, or how many. */
export const fileSummary = (
  files: ArrayLike<{ name: string }> | null
): string | undefined =>
  !files?.length
    ? undefined
    : files.length === 1
      ? files[0]!.name
      : `${files.length} files`

/**
 * A native file input with a greese ui Button: the platform file picker
 * (camera and photo library on phones), files dropped on it, and the chosen
 * file names beside the button. The input itself stays in the page, visually
 * hidden, for keyboards, forms and screen readers; the Button is its
 * `<label>`, so it takes the theme's button shape and states. `className`
 * and `style` go to the frame; every other prop (and `ref`) goes to the
 * input.
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
  buttonLabel = 'Choose file',
  placeholder = 'No file chosen',
  className,
  style,
  id,
  required,
  disabled,
  onChange,
  ref,
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
  const input = useRef<HTMLInputElement>(null)
  const [chosen, setChosen] = useState<string>()

  // A form's reset empties the input without a change event.
  useEffect(() => {
    const form = input.current?.form
    if (!form) return
    const onReset = () => setChosen(undefined)
    form.addEventListener('reset', onReset)
    return () => form.removeEventListener('reset', onReset)
  }, [])

  // A file dropped on the frame goes to the input, as on a native one: the
  // input is hidden, so it isn't the drop target itself.
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!control.disabled) event.preventDefault()
  }
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    const el = input.current
    const { files } = event.dataTransfer
    if (!el || control.disabled || !files.length) return
    event.preventDefault()
    if (files.length > 1 && !el.multiple) return
    el.files = files
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }

  return withGreese(
    <div
      className={cx('greese-FileInput', `greese-FileInput--size-${size}`, className)}
      style={style}
      data-invalid={control['aria-invalid']}
      data-disabled={control.disabled || undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <input
        {...props}
        {...control}
        ref={composeRefs(input, ref)}
        type="file"
        className="greese-FileInput-control"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setChosen(fileSummary(event.currentTarget.files))
          onChange?.(event)
        }}
      />
      <Button
        asChild
        variant="outline"
        tone={control['aria-invalid'] ? 'negative' : 'neutral'}
        size={size}
        disabled={control.disabled}
        className="greese-FileInput-button"
      >
        <label htmlFor={control.id}>{buttonLabel}</label>
      </Button>
      {/* The input announces its own files; this is what it shows. */}
      <span className="greese-FileInput-files" aria-hidden="true">
        {chosen ?? placeholder}
      </span>
    </div>,
    greese
  )
}
