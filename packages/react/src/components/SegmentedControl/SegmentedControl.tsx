'use client'
import {
  createContext,
  use,
  useId,
  useMemo,
  type ComponentPropsWithRef,
  type JSX,
  type ReactNode,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'

interface SegmentedContextValue {
  name: string
  value?: string
  select: (value: string) => void
}

const SegmentedContext = createContext<SegmentedContextValue | null>(null)

export interface SegmentedControlProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'onChange' | 'defaultValue'
> {
  /** Names the group for assistive tech. Hidden visually unless `hideLabel={false}`. */
  label: ReactNode
  /** @default true */
  hideLabel?: boolean
  /** Shared `name` for form submission; generated when omitted. */
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** @default 'md' */
  size?: 'sm' | 'md'
  /** Stretch to the container's width, segments sharing it equally. */
  fullWidth?: boolean
}

/**
 * A compact single choice between a few options, e.g. List / Grid. Built on
 * native radios, so arrow keys move the selection and it submits with forms.
 *
 * ```tsx
 * <SegmentedControl label="View" defaultValue="list">
 *   <Segment value="list">List</Segment>
 *   <Segment value="grid">Grid</Segment>
 * </SegmentedControl>
 * ```
 */
export const SegmentedControl = ({
  label,
  hideLabel = true,
  name,
  value: valueProp,
  defaultValue,
  onValueChange,
  size = 'md',
  fullWidth,
  className,
  children,
  ...props
}: SegmentedControlProps): JSX.Element => {
  const generated = useId()
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange as ((value: string | undefined) => void) | undefined,
  })
  const context = useMemo(
    () => ({ name: name ?? generated, value, select: setValue }),
    [name, generated, value, setValue]
  )
  return (
    <fieldset
      role="radiogroup"
      {...props}
      className={cx(
        'sauce-SegmentedControl',
        `sauce-SegmentedControl--size-${size}`,
        fullWidth && 'sauce-SegmentedControl--full',
        className
      )}
    >
      <legend className={hideLabel ? 'sauce-VisuallyHidden' : 'sauce-Field-label'}>
        {label}
      </legend>
      <SegmentedContext value={context}>
        <div className="sauce-SegmentedControl-track">{children}</div>
      </SegmentedContext>
    </fieldset>
  )
}

export interface SegmentProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'value' | 'children'
> {
  value: string
  children: ReactNode
}

/** One option of a SegmentedControl. */
export const Segment = ({
  value,
  children,
  className,
  onChange,
  ...props
}: SegmentProps): JSX.Element => {
  const group = use(SegmentedContext)
  if (!group) throw new Error('<Segment> must be used inside <SegmentedControl>.')
  return (
    <label className={cx('sauce-Segment', className)}>
      <input
        {...props}
        type="radio"
        className="sauce-Segment-input"
        name={group.name}
        value={value}
        checked={group.value === value}
        onChange={(event) => {
          onChange?.(event)
          if (event.target.checked) group.select(value)
        }}
      />
      <span className="sauce-Segment-label">{children}</span>
    </label>
  )
}
