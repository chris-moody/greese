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
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

interface SegmentedContextValue {
  name: string
  value?: string
  select: (value: string) => void
}

const SegmentedContext = createContext<SegmentedContextValue | null>(null)

export interface SegmentedControlProps
  extends
    GreeseProps,
    Omit<ComponentPropsWithRef<'fieldset'>, 'onChange' | 'defaultValue'> {
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
  greese,
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
  return withGreese(
    <fieldset
      role="radiogroup"
      {...props}
      className={cx(
        'greese-SegmentedControl',
        `greese-SegmentedControl--size-${size}`,
        fullWidth && 'greese-SegmentedControl--full',
        className
      )}
    >
      <legend className={hideLabel ? 'greese-VisuallyHidden' : 'greese-Field-label'}>
        {label}
      </legend>
      <SegmentedContext value={context}>
        <div className="greese-SegmentedControl-track">{children}</div>
      </SegmentedContext>
    </fieldset>,
    greese
  )
}

export interface SegmentProps
  extends
    GreeseProps,
    Omit<ComponentPropsWithRef<'input'>, 'type' | 'value' | 'children'> {
  value: string
  children: ReactNode
}

/** One option of a SegmentedControl. */
export const Segment = ({
  greese,
  value,
  children,
  className,
  onChange,
  ...props
}: SegmentProps): JSX.Element => {
  const group = use(SegmentedContext)
  if (!group) throw new Error('<Segment> must be used inside <SegmentedControl>.')
  return withGreese(
    <label className={cx('greese-Segment', className)}>
      <input
        {...props}
        type="radio"
        className="greese-Segment-input"
        name={group.name}
        value={value}
        checked={group.value === value}
        onChange={(event) => {
          onChange?.(event)
          if (event.target.checked) group.select(value)
        }}
      />
      <span className="greese-Segment-label">{children}</span>
    </label>,
    greese
  )
}
