'use client'
import {
  createContext,
  use,
  useId,
  type ComponentPropsWithRef,
  type JSX,
  type ReactNode,
} from 'react'
import { cx } from '../../utils/cx.ts'
import {
  Collapsible,
  type CollapsibleIconTransition,
  type CollapsibleProps,
} from '../Collapsible/Collapsible.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

interface AccordionDefaults {
  name?: string
  icon?: ReactNode
  openIcon?: ReactNode
  iconTransition?: CollapsibleIconTransition
}

const AccordionContext = createContext<AccordionDefaults>({})

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
  ...props
}: AccordionProps): JSX.Element => {
  const name = useId()
  return withGreese(
    <AccordionContext
      value={{ name: exclusive ? name : undefined, icon, openIcon, iconTransition }}
    >
      <div {...props} className={cx('greese-Accordion', className)} />
    </AccordionContext>,
    greese
  )
}

export type AccordionItemProps = CollapsibleProps

/** One section of an Accordion. Takes every Collapsible prop. */
export const AccordionItem = ({
  greese,
  className,
  name,
  icon,
  openIcon,
  iconTransition,
  ...props
}: AccordionItemProps): JSX.Element => {
  const group = use(AccordionContext)
  // The item's icons are a set: setting either replaces the group's pair and
  // its transition, which was chosen for the group's icons.
  const own = icon !== undefined || openIcon !== undefined
  return withGreese(
    <Collapsible
      {...props}
      name={name ?? group.name}
      icon={own ? icon : group.icon}
      openIcon={own ? openIcon : group.openIcon}
      iconTransition={iconTransition ?? (own ? undefined : group.iconTransition)}
      className={cx('greese-AccordionItem', className)}
    />,
    greese
  )
}
