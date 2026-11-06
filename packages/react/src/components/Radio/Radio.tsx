'use client'
import {
  createContext,
  use,
  useId,
  useMemo,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type JSX,
  type ReactNode,
} from 'react'
import type { ControlSize } from '../Button/Button.tsx'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import {
  ChoiceGroupShell,
  ChoiceText,
  type ChoiceGroupProps,
} from '../ChoiceGroup/ChoiceGroup.tsx'
import { useFieldControl } from '../Field/Field.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

interface RadioGroupContextValue {
  name: string
  value?: string
  select: (value: string) => void
  invalid?: boolean
  required?: boolean
  describedBy?: string
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

export interface RadioProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'input'>, 'type' | 'size' | 'value'> {
  /** Submitted with the form and reported by the group when chosen. */
  value: string
  /** The visible label, beside the radio. */
  label?: ReactNode
  /** A muted line under the label, announced with it. */
  description?: ReactNode
  /** Marks it invalid and colors it as an error. The group's `error` sets it too. */
  invalid?: boolean
  /**
   * Height, padding and text size: `xs` through `xl`, matching every other
   * control so a row of them lines up. @default 'md'
   */
  size?: ControlSize
}

/**
 * A native radio, styled. Use inside RadioGroup, which supplies the shared
 * `name`, so arrow keys move the selection as the platform expects.
 */
export const Radio = ({
  size = 'md',
  greese,
  label,
  description,
  invalid,
  onChange,
  className,
  style,
  id,
  required,
  disabled,
  'aria-describedby': describedBy,
  ...props
}: RadioProps): JSX.Element => {
  const group = use(RadioGroupContext)
  const descriptionId = useId()
  const control = useFieldControl({
    id,
    invalid: invalid ?? group?.invalid,
    required: required ?? group?.required,
    disabled,
    'aria-describedby': cx(
      describedBy,
      description ? descriptionId : undefined,
      group?.describedBy
    ),
  })
  const groupProps = group
    ? { name: group.name, checked: group.value === props.value }
    : {}

  return withGreese(
    <div
      className={cx('greese-Radio', `greese-Radio--size-${size}`, className)}
      style={style}
      data-disabled={control.disabled || undefined}
    >
      <span className="greese-Checkbox-box">
        <input
          {...props}
          {...groupProps}
          {...control}
          type="radio"
          className="greese-Radio-input"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onChange?.(event)
            if (event.target.checked) group?.select(props.value)
          }}
        />
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

export interface RadioGroupProps extends GreeseProps, ChoiceGroupProps {
  /** Shared `name`; generated when omitted. */
  name?: string
  /** The chosen value, when you control it. Pair with `onValueChange`. */
  value?: string
  /** The value chosen at first, when the group keeps its own state. */
  defaultValue?: string
  /** Called with the newly chosen value. */
  onValueChange?: (value: string) => void
  /**
   * Height, padding and text size of every radio in the group: `xs` through
   * `xl`, matching every other control. It reaches them through a custom
   * property, so a radio inside needs no size of its own. @default 'md'
   */
  size?: ControlSize
}

/**
 * A labelled set of radios (`<fieldset>` + `<legend>`), one selectable.
 *
 * ```tsx
 * <RadioGroup label="Plan" defaultValue="pro" direction={{ xs: 'column', md: 'row' }}>
 *   <Radio value="free" label="Free" />
 *   <Radio value="pro" label="Pro" />
 * </RadioGroup>
 * ```
 */
export const RadioGroup = ({
  greese,
  size = 'md',
  className,
  name,
  value: valueProp,
  defaultValue,
  onValueChange,
  invalid,
  error,
  required,
  children,
  ...props
}: RadioGroupProps): JSX.Element => {
  const generatedName = useId()
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange as ((value: string | undefined) => void) | undefined,
  })
  const isInvalid = invalid ?? Boolean(error)
  return withGreese(
    <ChoiceGroupShell
      {...props}
      className={cx(`greese-ChoiceGroup--size-${size}`, className)}
      error={error}
      invalid={isInvalid}
      required={required}
      role="radiogroup"
    >
      {({ describedBy }) => (
        <RadioGroupProvider
          name={name ?? generatedName}
          value={value}
          invalid={isInvalid}
          required={required}
          describedBy={describedBy}
          setValue={setValue}
        >
          {children}
        </RadioGroupProvider>
      )}
    </ChoiceGroupShell>,
    greese
  )
}

const RadioGroupProvider = ({
  setValue,
  children,
  name,
  value,
  invalid,
  required,
  describedBy,
}: Omit<RadioGroupContextValue, 'select'> & {
  setValue: (value: string) => void
  children: ReactNode
}) => {
  const context = useMemo<RadioGroupContextValue>(
    () => ({ name, value, invalid, required, describedBy, select: setValue }),
    [name, value, invalid, required, describedBy, setValue]
  )
  return <RadioGroupContext value={context}>{children}</RadioGroupContext>
}
