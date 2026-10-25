import {
  useId,
  type ComponentPropsWithRef,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react'
import { cx } from '../../utils/cx.ts'
import { SortIcon } from '@greese/icons'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

/** Below this breakpoint, rows stack into cards. */
export type TableStackBreakpoint = 'sm' | 'md' | 'lg'

// When stacked, rows are no longer display:table-*, and browsers drop table
// semantics for them; explicit roles keep the table announced as a table.
// Every table carries them, stacked or not: they're redundant (and harmless)
// on a plain table, and knowing which tables stack would take a context,
// which would make every part a client component (ADR 0007, addendum).

export interface TableProps extends GreeseProps, ComponentPropsWithRef<'table'> {
  /** Names the table (rendered as `<caption>`). Required: tables need a name. */
  caption: ReactNode
  /** Keep the caption for assistive tech but hide it on screen. */
  hideCaption?: boolean
  /** Row height: `comfortable`, or `compact` for dense data. @default 'comfortable' */
  density?: 'compact' | 'comfortable'
  /** Shade every other body row. */
  striped?: boolean
  /** Highlight the row under the pointer. */
  hoverable?: boolean
  /**
   * Keep the header visible while the table body scrolls. Needs `maxHeight`:
   * the table scrolls inside its own region (a horizontally scrollable box
   * can't stick to the page).
   */
  stickyHeader?: boolean
  /** Maximum height of the scroll region, any CSS length. */
  maxHeight?: string
  /**
   * Below this breakpoint, each row becomes a card of label/value pairs
   * (give every TableCell a `label`). Wide tables stay readable on phones.
   */
  stackBelow?: TableStackBreakpoint
}

/**
 * A data table: native `<table>` semantics in a keyboard-scrollable region.
 *
 * ```tsx
 * <Table caption="Invoices" stackBelow="sm">
 *   <TableHead><TableRow><TableHeaderCell>Number</TableHeaderCell>…</TableRow></TableHead>
 *   <TableBody><TableRow><TableCell label="Number">INV-001</TableCell>…</TableRow></TableBody>
 * </Table>
 * ```
 */
export const Table = ({
  greese,
  caption,
  hideCaption,
  density = 'comfortable',
  striped,
  hoverable,
  stickyHeader,
  maxHeight,
  stackBelow,
  className,
  style,
  children,
  ...props
}: TableProps): JSX.Element => {
  const captionId = useId()
  return withGreese(
    <div
      role="region"
      aria-labelledby={captionId}
      // Focusable, so keyboard users can scroll a wide table.
      tabIndex={0}
      className={cx(
        'greese-Table',
        `greese-Table--${density}`,
        striped && 'greese-Table--striped',
        hoverable && 'greese-Table--hoverable',
        stickyHeader && 'greese-Table--sticky',
        stackBelow && `greese-Table--stack-below-${stackBelow}`,
        className
      )}
      style={
        maxHeight
          ? ({ '--greese-table-max-height': maxHeight, ...style } as CSSProperties)
          : style
      }
    >
      <table {...props} role="table" className="greese-Table-table">
        <caption
          id={captionId}
          className={cx('greese-Table-caption', hideCaption && 'greese-VisuallyHidden')}
        >
          {caption}
        </caption>
        {children}
      </table>
    </div>,
    greese
  )
}

/**
 * The header row group: the TableRow of column headers.
 *
 * ```tsx
 * <TableHead><TableRow><TableHeaderCell>Name</TableHeaderCell></TableRow></TableHead>
 * ```
 */
export const TableHead = ({
  greese,
  ...props
}: ComponentPropsWithRef<'thead'> & GreeseProps): JSX.Element =>
  withGreese(<thead role="rowgroup" {...props} />, greese)

/** Rows here can enter in sequence: `greese={{ enter: 'fadeUp', stagger: 0.04 }}`. */
export const TableBody = ({
  greese,
  ...props
}: ComponentPropsWithRef<'tbody'> & GreeseProps): JSX.Element =>
  withGreese(<tbody role="rowgroup" {...props} />, greese)

/**
 * The footer row group, for totals: stays a row group when the table stacks.
 *
 * ```tsx
 * <TableFoot><TableRow><TableCell label="Total">$420</TableCell></TableRow></TableFoot>
 * ```
 */
export const TableFoot = ({
  greese,
  ...props
}: ComponentPropsWithRef<'tfoot'> & GreeseProps): JSX.Element =>
  withGreese(<tfoot role="rowgroup" {...props} />, greese)

/**
 * One row; a card of label/value pairs when the table stacks.
 *
 * ```tsx
 * <TableRow><TableCell label="Number">INV-001</TableCell></TableRow>
 * ```
 */
export const TableRow = ({
  greese,
  className,
  ...props
}: ComponentPropsWithRef<'tr'> & GreeseProps): JSX.Element =>
  withGreese(
    <tr role="row" {...props} className={cx('greese-TableRow', className)} />,
    greese
  )

export type SortDirection = 'ascending' | 'descending' | 'none'

export interface TableHeaderCellProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'th'>, 'align'> {
  /** Current sort of this column. Set `ascending`/`descending` on one column only. */
  sort?: SortDirection
  /** Makes the header a sort button. */
  onSort?: () => void
  /** Text alignment in the column. Use `end` for numbers. @default 'start' */
  align?: 'start' | 'center' | 'end'
  /** The column's name. */
  children?: ReactNode
}

/** A column header; sortable with `onSort` (announced through `aria-sort`). */
export const TableHeaderCell = ({
  greese,
  sort,
  onSort,
  align,
  scope = 'col',
  className,
  children,
  ...props
}: TableHeaderCellProps): JSX.Element =>
  withGreese(
    <th
      role={scope === 'row' ? 'rowheader' : 'columnheader'}
      scope={scope}
      aria-sort={sort === 'ascending' || sort === 'descending' ? sort : undefined}
      {...props}
      data-align={align && align !== 'start' ? align : undefined}
      className={cx('greese-TableHeaderCell', className)}
    >
      {onSort ? (
        <button
          type="button"
          className="greese-TableHeaderCell-sort"
          data-sort={sort ?? 'none'}
          onClick={onSort}
        >
          {children}
          <SortIcon strokeWidth={1.5} />
        </button>
      ) : (
        children
      )}
    </th>,
    greese
  )

export interface TableCellProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'td'>, 'align'> {
  /** The column name, shown beside the value when rows stack into cards. */
  label?: string
  /** Text alignment in the cell. Use `end` for numbers. @default 'start' */
  align?: 'start' | 'center' | 'end'
}

/**
 * A data cell. Give it the column's `label` so stacked rows can show it.
 *
 * ```tsx
 * <TableCell label="Total" align="end">$10</TableCell>
 * ```
 */
export const TableCell = ({
  greese,
  label,
  align,
  className,
  ...props
}: TableCellProps): JSX.Element =>
  withGreese(
    <td
      role="cell"
      data-label={label}
      {...props}
      data-align={align && align !== 'start' ? align : undefined}
      className={cx('greese-TableCell', className)}
    />,
    greese
  )
