import type { ComponentPropsWithRef, JSX } from 'react'
import { cx, Stack, type StackProps } from '@greese/react'

/**
 * The parts the timeline's panels are built from. Internal: an editor's own
 * panels use `PropertyGrid` and greese's layout components.
 */

/** A panel's body: a padded column. */
export const PanelBody = ({
  className,
  ...props
}: ComponentPropsWithRef<'div'>): JSX.Element => (
  <div {...props} className={cx('greese-AuthoringPanel', className)} />
)

/** A row's name, muted. */
export const FieldLabel = ({
  className,
  ...props
}: ComponentPropsWithRef<'div'>): JSX.Element => (
  <div {...props} className={cx('greese-AuthoringPanel-label', className)} />
)

/** What a panel shows with nothing selected. */
export const EmptyState = ({
  className,
  ...props
}: ComponentPropsWithRef<'div'>): JSX.Element => (
  <div {...props} className={cx('greese-AuthoringPanel-empty', className)} />
)

/** A dialog's column of fields, wide enough not to collapse around a short one. */
export const DialogFields = ({
  className,
  gap = '3',
  ...props
}: StackProps): JSX.Element => (
  <Stack
    {...props}
    direction="column"
    gap={gap}
    className={cx('greese-AuthoringPanel-dialogFields', className)}
  />
)
