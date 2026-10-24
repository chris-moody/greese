import {
  cloneElement,
  isValidElement,
  type ComponentPropsWithRef,
  type JSX,
  type ReactElement,
  type ReactNode,
} from 'react'
import { flattenChildren } from '../../utils/children.ts'
import { cx } from '../../utils/cx.ts'
import { CheckIcon } from '@greese/icons'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { BrandTone } from '../../utils/tone.ts'

export type StepStatus = 'complete' | 'current' | 'upcoming'

export interface StepsProps extends GreeseProps, ComponentPropsWithRef<'ol'> {
  /**
   * The current step's index, from 0: earlier steps are complete, later ones
   * upcoming. Leave it out for a list of events (a timeline), where no step
   * is complete or current and each marker shows its own tone.
   */
  current?: number
  /**
   * `horizontal`: a row, with the steps' text under their markers; it
   * scrolls sideways when it doesn't fit. `vertical`: a column, with the
   * text beside each marker.
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical'
  /**
   * What the markers show: the step `numbers` (a tick once complete), or
   * small `dots`, as on a timeline. A Step's own `marker` replaces either.
   * @default 'numbers'
   */
  markers?: 'numbers' | 'dots'
}

/** A step's status from its index and the current one; none without `current`. */
export const stepStatus = (
  index: number,
  current: number | undefined
): StepStatus | undefined =>
  current === undefined
    ? undefined
    : index > current
      ? 'upcoming'
      : index === current
        ? 'current'
        : 'complete'

/**
 * Steps in order: the stages of a process, or events on a timeline. A native
 * `<ol>`; with `current`, the current step is `aria-current="step"` and
 * completed ones say so to screen readers.
 *
 * ```tsx
 * <Steps current={1}>
 *   <Step>Cart</Step>
 *   <Step>Shipping</Step>
 *   <Step>Payment</Step>
 * </Steps>
 *
 * <Steps direction="vertical" markers="dots">
 *   <Step prefix={<time dateTime="2026-10-19T09:12">09:12</time>} prefixBefore tone="positive"
 *     description="Version 1.4 is live.">Deployed</Step>
 *   <Step prefix="08:55" prefixBefore>Build passed</Step>
 * </Steps>
 * ```
 */
export const Steps = ({
  greese,
  current,
  direction = 'horizontal',
  markers = 'numbers',
  className,
  children,
  ...props
}: StepsProps): JSX.Element => {
  let index = 0
  return withGreese(
    <ol
      {...props}
      className={cx(
        'greese-Steps',
        `greese-Steps--${direction}`,
        `greese-Steps--${markers}`,
        className
      )}
    >
      {flattenChildren(children).map((child) => {
        if (!isValidElement(child)) return child
        const step = child as ReactElement<StepProps>
        const status = step.props.status ?? stepStatus(index, current)
        index += 1
        return cloneElement(step, {
          status,
          marker: step.props.marker ?? (markers === 'numbers' ? index : undefined),
        })
      })}
    </ol>,
    greese
  )
}

export interface StepProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'li'>, 'prefix'> {
  /** Set by Steps from its `current`; set it here to override. */
  status?: StepStatus
  /**
   * What the marker shows: the step number by default (a tick once
   * complete), a dot with `markers="dots"`, or this: a small icon.
   */
  marker?: ReactNode
  /** Detail under the title: a line of text, or richer content. */
  description?: ReactNode
  /**
   * Content ahead of the step, such as a time or a date. Above the title by
   * default; see `prefixBefore`.
   */
  prefix?: ReactNode
  /**
   * Put the prefix before the marker instead of above the title: in its own
   * column on vertical steps (a column every step then shares), above the
   * marker on horizontal ones.
   * @default false
   */
  prefixBefore?: boolean
  /**
   * The color of this step's marker, and of the line on to the next step
   * once it's complete: neutral, accent, a brand color (primary, secondary,
   * tertiary), positive, negative, warning or info.
   * @default 'primary'
   */
  tone?: 'neutral' | BrandTone | 'positive' | 'negative' | 'warning' | 'info'
}

/** One step in Steps. */
export const Step = ({
  greese,
  status,
  marker,
  description,
  prefix,
  prefixBefore,
  tone = 'primary',
  className,
  children,
  ...props
}: StepProps): JSX.Element => {
  const prefixed = prefix !== undefined && prefix !== null && (
    <div className="greese-Step-prefix">{prefix}</div>
  )
  return withGreese(
    <li
      aria-current={status === 'current' ? 'step' : undefined}
      {...props}
      className={cx(
        'greese-Step',
        `greese-Step--${status ?? 'event'}`,
        `greese-Step--${tone}`,
        prefixed && prefixBefore && 'greese-Step--prefix-before',
        className
      )}
    >
      {prefixBefore && prefixed}
      <span className="greese-Step-marker" aria-hidden="true">
        {status === 'complete' && typeof marker === 'number' ? (
          <CheckIcon strokeWidth={2} />
        ) : (
          marker
        )}
      </span>
      <div className="greese-Step-body">
        {!prefixBefore && prefixed}
        <div className="greese-Step-title">
          {status === 'complete' && (
            <span className="greese-VisuallyHidden">Completed: </span>
          )}
          {children}
        </div>
        {description && <div className="greese-Step-description">{description}</div>}
      </div>
    </li>,
    greese
  )
}
