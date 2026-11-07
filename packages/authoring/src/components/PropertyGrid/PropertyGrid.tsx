import type { ComponentPropsWithRef, CSSProperties, JSX } from 'react'
import { cx } from '@greese/react'

export interface PropertyGridProps extends ComponentPropsWithRef<'div'> {
  /** Fields side by side in each row: 2 for an X and Y pair. @default 1 */
  columns?: number
}

/**
 * A panel's property rows: `EditableField`s whose names line up in one
 * column and whose controls line up in the next, however long each name is.
 * With `columns`, fields sit side by side (Start X beside Start Y), each
 * pair aligned with the rows above. A field laid out as a column, or anything
 * that isn't a row, spans the grid.
 *
 * ```tsx
 * <PropertyGrid columns={2}>
 *   <EditableField label="X" value={x} onValueChange={setX} />
 *   <EditableField label="Y" value={y} onValueChange={setY} />
 * </PropertyGrid>
 * ```
 */
export const PropertyGrid = ({
  columns = 1,
  className,
  style,
  ...props
}: PropertyGridProps): JSX.Element => (
  <div
    {...props}
    className={cx('greese-PropertyGrid', className)}
    style={{ '--greese-propertygrid-columns': columns, ...style } as CSSProperties}
  />
)
