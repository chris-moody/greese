import { Children, Fragment, isValidElement, type ReactNode } from 'react'

/**
 * Children as a flat list, fragments opened up: `<>{a}{b}</>` is two
 * children, as authors mean it, not one. For components that number or
 * label their children (Steps, ScrollCarousel).
 */
export const flattenChildren = (children: ReactNode): ReactNode[] =>
  Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flattenChildren(child.props.children)
      : [child]
  )
