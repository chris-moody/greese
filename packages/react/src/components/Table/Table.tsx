'use client'
import {
  createContext,
  use,
  useId,
  type ComponentPropsWithRef,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react'
import { cx } from '../../utils/cx.ts'
import { SortGlyph } from '../../utils/glyphs.tsx'

/** Below this breakpoint, rows stack into cards. */
export type TableStackBreakpoint = 'sm' | 'md' | 'lg'

// When stacked, rows are no longer display:table-*, and browsers drop table
// semantics for them; explicit roles keep the table announced as a table.
const StackedContext = createContext(false)
const role = (stacked: boolean, value: string) => (stacked ? value : undefined)

export interface TableProps extends ComponentPropsWithRef<'table'> {
  /** Names the table (rendered as `<caption>`). Required: tables need a name. */
  caption: ReactNode
  /** Keep the caption for assistive tech but hide it on screen. */
  hideCaption?: boolean
  /** @default 'comfortable' */
  density?: 'compact' | 'comfortable'
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
  const stacked = stackBelow !== undefined
  return (
    <div
      role="region"
      aria-labelledby={captionId}
      // Focusable, so keyboard users can scroll a wide table.
      tabIndex={0}
      className={cx(
        'sauce-Table',
        `sauce-Table--${density}`,
        striped && 'sauce-Table--striped',
        hoverable && 'sauce-Table--hoverable',
        stickyHeader && 'sauce-Table--sticky',
        stackBelow && `sauce-Table--stack-below-${stackBelow}`,
        className
      )}
      style={
        maxHeight
          ? ({ '--sauce-table-max-height': maxHeight, ...style } as CSSProperties)
          : style
      }
    >
      <table {...props} role={role(stacked, 'table')} className="sauce-Table-table">
        <caption
          id={captionId}
          className={cx('sauce-Table-caption', hideCaption && 'sauce-VisuallyHidden')}
        >
          {caption}
        </caption>
        <StackedContext value={stacked}>{children}</StackedContext>
      </table>
    </div>
  )
}

export const TableHead = (props: ComponentPropsWithRef<'thead'>): JSX.Element => (
  <thead role={role(use(StackedContext), 'rowgroup')} {...props} />
)

export const TableBody = (props: ComponentPropsWithRef<'tbody'>): JSX.Element => (
  <tbody role={role(use(StackedContext), 'rowgroup')} {...props} />
)

export const TableFoot = (props: ComponentPropsWithRef<'tfoot'>): JSX.Element => (
  <tfoot role={role(use(StackedContext), 'rowgroup')} {...props} />
)

export const TableRow = ({
  className,
  ...props
}: ComponentPropsWithRef<'tr'>): JSX.Element => (
  <tr
    role={role(use(StackedContext), 'row')}
    {...props}
    className={cx('sauce-TableRow', className)}
  />
)

export type SortDirection = 'ascending' | 'descending' | 'none'

export interface TableHeaderCellProps extends Omit<ComponentPropsWithRef<'th'>, 'align'> {
  /** Current sort of this column. Set `ascending`/`descending` on one column only. */
  sort?: SortDirection
  /** Makes the header a sort button. */
  onSort?: () => void
  /** @default 'start' */
  align?: 'start' | 'center' | 'end'
  children?: ReactNode
}

/** A column header; sortable with `onSort` (announced through `aria-sort`). */
export const TableHeaderCell = ({
  sort,
  onSort,
  align,
  scope = 'col',
  className,
  children,
  ...props
}: TableHeaderCellProps): JSX.Element => (
  <th
    role={role(use(StackedContext), scope === 'row' ? 'rowheader' : 'columnheader')}
    scope={scope}
    aria-sort={sort === 'ascending' || sort === 'descending' ? sort : undefined}
    {...props}
    data-align={align && align !== 'start' ? align : undefined}
    className={cx('sauce-TableHeaderCell', className)}
  >
    {onSort ? (
      <button
        type="button"
        className="sauce-TableHeaderCell-sort"
        data-sort={sort ?? 'none'}
        onClick={onSort}
      >
        {children}
        <SortGlyph />
      </button>
    ) : (
      children
    )}
  </th>
)

export interface TableCellProps extends Omit<ComponentPropsWithRef<'td'>, 'align'> {
  /** The column name, shown beside the value when rows stack into cards. */
  label?: string
  /** @default 'start' */
  align?: 'start' | 'center' | 'end'
}

export const TableCell = ({
  label,
  align,
  className,
  ...props
}: TableCellProps): JSX.Element => (
  <td
    role={role(use(StackedContext), 'cell')}
    data-label={label}
    {...props}
    data-align={align && align !== 'start' ? align : undefined}
    className={cx('sauce-TableCell', className)}
  />
)
