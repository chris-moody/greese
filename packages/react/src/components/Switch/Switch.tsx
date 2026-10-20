'use client'
import type { ChangeEvent, ComponentPropsWithRef, JSX, ReactNode } from 'react'
import { useId } from 'react'
import { cx } from '../../utils/cx.ts'
import { ChoiceText } from '../ChoiceGroup/ChoiceGroup.tsx'
import { useFieldControl } from '../Field/Field.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface SwitchProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  /** Text beside the switch. Without it, give the switch an `aria-label`. */
  label?: ReactNode
  /** A muted line under the label, announced with it. */
  description?: ReactNode
  /**
   * Marks it invalid and colors it as an error. A surrounding Field's `error`
   * sets it too.
   */
  invalid?: boolean
  /** Called with the new state when it's turned on or off. */
  onCheckedChange?: (checked: boolean) => void
}

/**
 * An on/off switch for settings that apply immediately: a native checkbox
 * with `role="switch"`, so it is announced as on/off and submits like a
 * checkbox.
 */
export const Switch = ({
  greese,
  label,
  description,
  invalid,
  onCheckedChange,
  onChange,
  className,
  style,
  id,
  required,
  disabled,
  'aria-describedby': describedBy,
  ...props
}: SwitchProps): JSX.Element => {
  const descriptionId = useId()
  const control = useFieldControl({
    id,
    invalid,
    required,
    disabled,
    'aria-describedby': cx(describedBy, description ? descriptionId : undefined),
  })
  return withGreese(
    <div
      className={cx('greese-Switch', className)}
      style={style}
      data-disabled={control.disabled || undefined}
    >
      <span className="greese-Switch-track">
        <input
          {...props}
          {...control}
          type="checkbox"
          role="switch"
          className="greese-Switch-input"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onChange?.(event)
            onCheckedChange?.(event.target.checked)
          }}
        />
        <span className="greese-Switch-thumb" aria-hidden="true" />
      </span>
      <ChoiceText
        htmlFor={control.id}
        label={label}
        description={description}
        descriptionId={descriptionId}
      />
    </div>,
    greese
  )
}
