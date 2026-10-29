import { ViewTransition, type JSX, type ReactNode } from 'react'
import { shareClasses, shareName, type ShareKey } from '../../utils/share.ts'

export interface PageShareProps {
  /**
   * What pairs it with its twin on the other page: a key that means the same
   * thing on both, `'hero'` or `['template', id]`. Unique on each page.
   */
  id: ShareKey
  /** The element that morphs: one element, whose box is the one that moves. */
  children: ReactNode
}

/**
 * An element that morphs into its twin on the next page in a page transition
 * (ADR 0029): the same `id` on both pages, a template's card and its page's
 * hero, say. Its group's view-transition class (`greese-share-<group>`) lets a
 * theme or a rule style every template's morph at once. It's named only to
 * pair: in any other change it moves with the page. A Server Component; it
 * needs React 19.3, and renders its child as it is before that.
 *
 * ```tsx
 * <PageShare id={['template', template.id]}>
 *   <Card>…</Card>
 * </PageShare>
 * ```
 */
export const PageShare = ({ id, children }: PageShareProps): JSX.Element =>
  ViewTransition ? (
    <ViewTransition name={shareName(id)} share={shareClasses(id)} default="none">
      {children}
    </ViewTransition>
  ) : (
    <>{children}</>
  )
