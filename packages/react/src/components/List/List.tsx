import type { ComponentPropsWithRef, JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface ListProps extends GreeseProps, ComponentPropsWithRef<'ul'> {
  /** Lines between rows. @default true */
  divided?: boolean
  /** A bordered box around the rows. @default false */
  framed?: boolean
}

/**
 * Rows of related things (people, files, settings), each with optional
 * media, text and actions: a native `<ul>`.
 *
 * ```tsx
 * <List framed>
 *   <ListItem start={<Avatar name="Ada Lovelace" />} title="Ada Lovelace"
 *     description="Analyst" end={<Button size="sm">Message</Button>} />
 * </List>
 * ```
 */
export const List = ({
  greese,
  divided = true,
  framed,
  className,
  ...props
}: ListProps): JSX.Element =>
  withGreese(
    <ul
      {...props}
      className={cx(
        'greese-List',
        divided && 'greese-List--divided',
        framed && 'greese-List--framed',
        className
      )}
    />,
    greese
  )

export interface ListItemProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'li'>, 'title'> {
  /** Media at the inline start: an Avatar, an icon, a thumbnail. */
  start?: ReactNode
  /** The main line. */
  title?: ReactNode
  /** A second, muted line. */
  description?: ReactNode
  /** At the inline end: actions, a Badge, a time. */
  end?: ReactNode
}

/** One row of a List. Anything in `children` goes under the text. */
export const ListItem = ({
  greese,
  start,
  title,
  description,
  end,
  className,
  children,
  ...props
}: ListItemProps): JSX.Element =>
  withGreese(
    <li {...props} className={cx('greese-ListItem', className)}>
      {start && <div className="greese-ListItem-start">{start}</div>}
      <div className="greese-ListItem-body">
        {title && <div className="greese-ListItem-title">{title}</div>}
        {description && <div className="greese-ListItem-description">{description}</div>}
        {children}
      </div>
      {end && <div className="greese-ListItem-end">{end}</div>}
    </li>,
    greese
  )
