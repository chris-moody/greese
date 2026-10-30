import {
  cloneElement,
  isValidElement,
  ViewTransition,
  type JSX,
  type ReactElement,
  type ReactNode,
} from 'react'
import { shareClasses, shareName, type ShareKey } from '../../utils/share.ts'
import { SHARE_LINK } from './shareLink.ts'

export interface PageShareProps {
  /**
   * What pairs it with its twin on the other page: a key that means the same
   * thing on both, `'hero'` or `['template', id]`. Unique on each page. Give
   * this or `link`.
   */
  id?: ShareKey
  /**
   * Pairs it by the link followed, with no key: on a list, the item around
   * the link that was clicked; on the page it leads to, the page's hero (its
   * one `link` element with no link inside). Going back, the hero pairs with
   * the item linking to the page left. Needs `usePageNavigate` for the
   * navigation.
   * @default false
   */
  link?: boolean
  /** The element that morphs: one element, whose box is the one that moves. */
  children: ReactNode
}

/**
 * An element that morphs into its twin on the next page in a page transition
 * (ADR 0029): the same `id` on both pages, a template's card and its page's
 * hero, say. Its group's view-transition class (`greese-share-<group>`) lets a
 * theme or a rule style every template's morph at once. It's named only to
 * pair: in any other change it moves with the page. With `link` instead of an
 * `id`, the link followed decides the pair. A Server Component; it needs
 * React 19.3, and renders its child as it is before that.
 *
 * ```tsx
 * <PageShare id={['template', template.id]}>
 *   <Card>…</Card>
 * </PageShare>
 * ```
 */
export const PageShare = ({
  id,
  link = false,
  children,
}: PageShareProps): JSX.Element => {
  if (link)
    return isValidElement(children) ? (
      cloneElement(children as ReactElement<Record<string, unknown>>, {
        [SHARE_LINK]: '',
      })
    ) : (
      <>{children}</>
    )
  if (id === undefined) return <>{children}</>
  return ViewTransition ? (
    <ViewTransition name={shareName(id)} share={shareClasses(id)} default="none">
      {children}
    </ViewTransition>
  ) : (
    <>{children}</>
  )
}
