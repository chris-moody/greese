'use client'
import {
  createContext,
  use,
  useLayoutEffect,
  useMemo,
  useRef,
  useId,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type JSX,
  type ReactNode,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import {
  ChoiceGroupShell,
  ChoiceText,
  type ChoiceGroupProps,
} from '../ChoiceGroup/ChoiceGroup.tsx'
import { useFieldControl } from '../Field/Field.tsx'
import { composeRefs } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface CheckboxProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  /** Text beside the box. Without it, give the checkbox an `aria-label`. */
  label?: ReactNode
  /** Secondary text under the label, announced with the checkbox. */
  description?: ReactNode
  /** The "some selected" state, e.g. for a select-all checkbox. */
  indeterminate?: boolean
  /**
   * Marks it invalid (`aria-invalid`) and colours it as an error. A surrounding
   * group's `error` sets it too.
   */
  invalid?: boolean
  /** Convenience alongside `onChange`: receives the new checked state. */
  onCheckedChange?: (checked: boolean) => void
}

interface CheckboxGroupContextValue {
  name?: string
  value: string[]
  toggle: (value: string, checked: boolean) => void
  invalid?: boolean
  describedBy?: string
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null)

/**
 * A native checkbox, styled. Works uncontrolled (`defaultChecked`), controlled
 * (`checked` + `onChange`/`onCheckedChange`), in native forms and in
 * CheckboxGroup (pass `value`).
 */
export const Checkbox = ({
  greese,
  label,
  description,
  indeterminate,
  invalid,
  onCheckedChange,
  onChange,
  className,
  style,
  ref,
  id,
  required,
  disabled,
  'aria-describedby': describedBy,
  ...props
}: CheckboxProps): JSX.Element => {
  const group = use(CheckboxGroupContext)
  const descriptionId = useId()
  const control = useFieldControl({
    id,
    invalid: invalid ?? group?.invalid,
    required,
    disabled,
    'aria-describedby': cx(
      describedBy,
      description ? descriptionId : undefined,
      group?.describedBy
    ),
  })
  const inputRef = useRef<HTMLInputElement>(null)

  // `indeterminate` is a DOM property only; there is no attribute for it.
  useLayoutEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])

  const inGroup = group && props.value !== undefined
  const groupProps = inGroup
    ? { name: group.name, checked: group.value.includes(String(props.value)) }
    : {}

  return withGreese(
    <div
      className={cx('greese-Checkbox', className)}
      style={style}
      data-disabled={control.disabled || undefined}
    >
      <span className="greese-Checkbox-box">
        <input
          {...props}
          {...groupProps}
          {...control}
          ref={composeRefs(inputRef, ref)}
          type="checkbox"
          className="greese-Checkbox-input"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onChange?.(event)
            onCheckedChange?.(event.target.checked)
            if (inGroup) group.toggle(String(props.value), event.target.checked)
          }}
        />
        <svg className="greese-Checkbox-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path className="greese-Checkbox-check" d="M3.5 8.5l3 3 6-7" />
          <path className="greese-Checkbox-dash" d="M4 8h8" />
        </svg>
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

export interface CheckboxGroupProps extends GreeseProps, ChoiceGroupProps {
  /** Shared `name` for native form submission. */
  name?: string
  /** Checked values (each Checkbox's `value`). */
  value?: string[]
  /** The values checked at first, when the group keeps its own state. */
  defaultValue?: string[]
  /** Called with every checked value whenever one is checked or unchecked. */
  onValueChange?: (value: string[]) => void
}

/**
 * A labelled set of checkboxes (`<fieldset>` + `<legend>`) that tracks which
 * values are checked.
 *
 * ```tsx
 * <CheckboxGroup label="Notify me by" defaultValue={['email']} name="notify">
 *   <Checkbox value="email" label="Email" />
 *   <Checkbox value="sms" label="SMS" />
 * </CheckboxGroup>
 * ```
 */
export const CheckboxGroup = ({
  greese,
  name,
  value: valueProp,
  defaultValue = [],
  onValueChange,
  invalid,
  error,
  children,
  ...props
}: CheckboxGroupProps): JSX.Element => {
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  })
  const isInvalid = invalid ?? Boolean(error)
  return withGreese(
    <ChoiceGroupShell {...props} error={error} invalid={isInvalid}>
      {({ describedBy }) => (
        <CheckboxGroupProvider
          name={name}
          value={value}
          invalid={isInvalid}
          describedBy={describedBy}
          setValue={setValue}
        >
          {children}
        </CheckboxGroupProvider>
      )}
    </ChoiceGroupShell>,
    greese
  )
}

const CheckboxGroupProvider = ({
  setValue,
  children,
  ...state
}: Omit<CheckboxGroupContextValue, 'toggle'> & {
  setValue: (next: (previous: string[]) => string[]) => void
  children: ReactNode
}) => {
  const { name, value, invalid, describedBy } = state
  const context = useMemo<CheckboxGroupContextValue>(
    () => ({
      name,
      value,
      invalid,
      describedBy,
      toggle: (item, checked) =>
        setValue((previous) =>
          checked
            ? [...previous.filter((v) => v !== item), item]
            : previous.filter((v) => v !== item)
        ),
    }),
    [name, value, invalid, describedBy, setValue]
  )
  return <CheckboxGroupContext value={context}>{children}</CheckboxGroupContext>
}
