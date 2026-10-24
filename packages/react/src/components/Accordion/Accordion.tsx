import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  useId,
  type ComponentPropsWithRef,
  type JSX,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cx } from '../../utils/cx.ts'
import {
  Collapsible,
  type CollapsibleIconTransition,
  type CollapsibleProps,
} from '../Collapsible/Collapsible.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface AccordionProps extends GreeseProps, ComponentPropsWithRef<'div'> {
  /**
   * Only one item open at a time. Native: the items share a `<details name>`,
   * so the browser closes the others. No JS involved. @default false
   */
  exclusive?: boolean
  /**
   * Every item's icon, closed (or both states without `openIcon`). An item
   * that sets `icon` or `openIcon` uses its own pair instead, never half of
   * each. @default a downward chevron
   */
  icon?: ReactNode
  /** Every item's open-state icon, unless the item sets its own icons. */
  openIcon?: ReactNode
  /**
   * How every item's icon changes state, unless the item sets its own icons
   * or transition. @default 'rotate', or 'fade' with an `openIcon`
   */
  iconTransition?: CollapsibleIconTransition
}

/**
 * A stack of collapsible sections. Each AccordionItem is a native
 * `<details>`, so keyboard, screen-reader and find-in-page support is built in.
 * A Server Component: it ships no JavaScript.
 *
 * It hands its items the shared `name` (with `exclusive`) and its icons
 * directly, so they reach the AccordionItems among its children (in fragments
 * and lists too). An item inside a component of your own isn't one of them:
 * give it `name` and icons itself.
 *
 * ```tsx
 * <Accordion exclusive icon={<PlusIcon />} openIcon={<MinusIcon />}>
 *   <AccordionItem title="Shipping">…</AccordionItem>
 *   <AccordionItem title="Returns">…</AccordionItem>
 * </Accordion>
 * ```
 */
export const Accordion = ({
  greese,
  exclusive,
  icon,
  openIcon,
  iconTransition,
  className,
  children,
  ...props
}: AccordionProps): JSX.Element => {
  const id = useId()
  const name = exclusive ? id : undefined
  // Each item gets the group's settings it doesn't set itself. Its icons are
  // a set: setting either keeps its own pair, and the transition chosen for
  // the group's icons isn't applied to them.
  const share = (node: ReactNode): ReactNode =>
    Children.map(node, (child) => {
      if (!isValidElement<{ children?: ReactNode }>(child)) return child
      if (child.type === Fragment)
        return cloneElement(child, undefined, share(child.props.children))
      if (child.type !== AccordionItem) return child
      const item = child as ReactElement<AccordionItemProps>
      const own = item.props.icon !== undefined || item.props.openIcon !== undefined
      return cloneElement(item, {
        name: item.props.name ?? name,
        ...(!own && {
          icon,
          openIcon,
          iconTransition: item.props.iconTransition ?? iconTransition,
        }),
      })
    })
  return withGreese(
    <div {...props} className={cx('greese-Accordion', className)}>
      {share(children)}
    </div>,
    greese
  )
}

export type AccordionItemProps = CollapsibleProps

/**
 * One section of an Accordion: a Collapsible, which takes the Accordion's
 * `name` and icons when it doesn't set its own. Takes every Collapsible prop.
 *
 * ```tsx
 * <AccordionItem title="Shipping">Ships in two days.</AccordionItem>
 * ```
 */
export const AccordionItem = ({
  greese,
  className,
  ...props
}: AccordionItemProps): JSX.Element =>
  withGreese(
    <Collapsible {...props} className={cx('greese-AccordionItem', className)} />,
    greese
  )
