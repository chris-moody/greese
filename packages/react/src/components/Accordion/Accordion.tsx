'use client'
import { createContext, use, useId, type ComponentPropsWithRef, type JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { Collapsible, type CollapsibleProps } from '../Collapsible/Collapsible.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

const AccordionContext = createContext<string | undefined>(undefined)

export interface AccordionProps extends GreeseProps, ComponentPropsWithRef<'div'> {
  /**
   * Only one item open at a time. Native: the items share a `<details name>`,
   * so the browser closes the others. No JS involved. @default false
   */
  exclusive?: boolean
}

/**
 * A stack of collapsible sections. Each AccordionItem is a native
 * `<details>`, so keyboard, screen-reader and find-in-page support is built in.
 *
 * ```tsx
 * <Accordion exclusive>
 *   <AccordionItem title="Shipping">…</AccordionItem>
 *   <AccordionItem title="Returns">…</AccordionItem>
 * </Accordion>
 * ```
 */
export const Accordion = ({
  greese,
  exclusive,
  className,
  ...props
}: AccordionProps): JSX.Element => {
  const name = useId()
  return withGreese(
    <AccordionContext value={exclusive ? name : undefined}>
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
  ...props
}: AccordionItemProps): JSX.Element => {
  const groupName = use(AccordionContext)
  return withGreese(
    <Collapsible
      {...props}
      name={name ?? groupName}
      className={cx('greese-AccordionItem', className)}
    />,
    greese
  )
}
