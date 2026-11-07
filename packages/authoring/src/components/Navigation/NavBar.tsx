import type { ComponentPropsWithRef, JSX, ReactNode } from 'react'
import { cx } from '@greese/react'

export interface NavBarProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** At the start: a `NavHistory`. */
  history?: ReactNode
  /** In the middle, taking the room: an `AuthoringBreadcrumbs`. */
  trail?: ReactNode
  /** At the end: an `EnvironmentSelect`. */
  end?: ReactNode
}

/**
 * An editor's nav bar: the parts every Glop studio's had, in their places.
 * Each slot takes the editor's own part, so only the arrangement is shared.
 *
 * ```tsx
 * <NavBar history={<NavHistory … />} trail={<AuthoringBreadcrumbs />} end={<EnvironmentSelect … />} />
 * ```
 */
export const NavBar = ({
  history,
  trail,
  end,
  className,
  ...props
}: NavBarProps): JSX.Element => (
  <div {...props} className={cx('greese-NavBar', className)}>
    {history}
    <div className="greese-NavBar-trail">{trail}</div>
    {end}
  </div>
)
