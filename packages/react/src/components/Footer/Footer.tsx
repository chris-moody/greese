import { Children, type ComponentPropsWithRef, type JSX, type ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { ContainerSize } from '../Container/Container.tsx'

/** Whether a node renders anything: `null`, `undefined` and booleans don't (conditional parts). */
const rendersSomething = (node: ReactNode): boolean => Children.toArray(node).length > 0

export interface FooterProps extends GreeseProps, ComponentPropsWithRef<'footer'> {
  /** The wordmark, logo or a line about the site, beside the sections. */
  brand?: ReactNode
  /** The closing row under a rule: copyright, legal links. */
  legal?: ReactNode
  /** How wide its content grows, as a Container: `lg` is 1024px, `full` the page. @default 'lg' */
  size?: ContainerSize
}

/**
 * The page's footer: a `<footer>` with the brand beside columns of links
 * (FooterSection), and a closing row under a rule. The columns fill the width
 * and wrap on narrow screens, the brand above them.
 *
 * ```tsx
 * <Footer brand={<Text weight="bold">Acme</Text>} legal="© 2026 Acme">
 *   <FooterSection title="Product"><Link href="/pricing">Pricing</Link></FooterSection>
 *   <FooterSection title="Company"><Link href="/about">About</Link></FooterSection>
 * </Footer>
 * ```
 */
export const Footer = ({
  greese,
  brand,
  legal,
  size = 'lg',
  className,
  children,
  ...props
}: FooterProps): JSX.Element => {
  const hasBrand = rendersSomething(brand)
  const hasSections = rendersSomething(children)
  return withGreese(
    <footer
      {...props}
      className={cx('greese-Footer', `greese-Footer--size-${size}`, className)}
    >
      <div className="greese-Footer-inner">
        {(hasBrand || hasSections) && (
          <div className="greese-Footer-main">
            {hasBrand && <div className="greese-Footer-brand">{brand}</div>}
            {hasSections && <div className="greese-Footer-sections">{children}</div>}
          </div>
        )}
        {rendersSomething(legal) && <div className="greese-Footer-legal">{legal}</div>}
      </div>
    </footer>,
    greese
  )
}

export interface FooterSectionProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'nav'>, 'title'> {
  /** The column's heading. */
  title: ReactNode
  /**
   * The navigation's accessible name, when `title` isn't text.
   * @default `title`, when it is text
   */
  label?: string
}

/**
 * One column of a Footer: a heading over its links, as a `<nav>` named by the
 * heading. Each child is an item of its list.
 *
 * ```tsx
 * <FooterSection title="Docs">
 *   <Link href="/start">Getting started</Link>
 *   <Link href="/theming">Theming</Link>
 * </FooterSection>
 * ```
 */
export const FooterSection = ({
  greese,
  title,
  label,
  className,
  children,
  ...props
}: FooterSectionProps): JSX.Element =>
  withGreese(
    <nav
      aria-label={label ?? (typeof title === 'string' ? title : undefined)}
      {...props}
      className={cx('greese-FooterSection', className)}
    >
      <p className="greese-FooterSection-title">{title}</p>
      <ul className="greese-FooterSection-links">
        {Children.map(children, (child) =>
          child == null || child === false ? null : <li>{child}</li>
        )}
      </ul>
    </nav>,
    greese
  )
