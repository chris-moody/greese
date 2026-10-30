/**
 * Shared elements paired by the link followed (ADR 0029): no ids.
 * `<PageShare link>` marks the elements that may pair; at a page change the
 * old page's end is named at once and the new page's in the commit, before
 * the browser's snapshot of it. Client-only: `usePageNavigate` calls it.
 *
 * React can't name these: entering a page, it names only the outermost
 * `<ViewTransition>`, and a nested one only as half of a pair with a React
 * one of the same name leaving. So both ends are named in the DOM.
 */
import { shareClasses } from '../../utils/share.ts'

/** The attribute `<PageShare link>` puts on its element. */
export const SHARE_LINK = 'data-greese-share-link'

const MARKED = `[${SHARE_LINK}]`

/** Names `el` for the pair, or (`on` false) lets it go. */
const name = (el: HTMLElement, on = true) => {
  for (const [prop, value] of [
    ['view-transition-name', 'greese-share-link'],
    ['view-transition-class', shareClasses(['link', ''])],
  ])
    if (on) el.style.setProperty(prop!, value!)
    else el.style.removeProperty(prop!)
}

/** A page's own end of a pair, its hero: its one marked element with no link in it. */
const heroOf = (marked: HTMLElement[]) => {
  const heroes = marked.filter((el) => !el.querySelector('a[href]'))
  return heroes.length === 1 ? heroes[0]! : null
}

/**
 * Pairs the old page's end of a link with the new page's, for one page
 * change: `link` is the link followed, if a link was; `back` its direction.
 * The new page's end is the element linking to the page left (its marked
 * ancestor, or the link), going back, else its hero. Does nothing on a page
 * with nothing marked.
 */
export const pairByLink = (link: Element | null, back: boolean): void => {
  const marked = (within: (el: Element) => boolean = () => true) =>
    [...document.querySelectorAll<HTMLElement>(MARKED)].filter(within)
  const from = link?.closest<HTMLElement>(MARKED) ?? heroOf(marked())
  if (!from) return
  const left = location.href.split('#')[0]
  name(from)
  const finish = (to?: HTMLElement | null) => {
    observer.disconnect()
    clearTimeout(timer)
    // Both snapshots are taken by the frame after next.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        name(from, false)
        if (to) name(to, false)
      })
    )
  }
  // The commit inserts the new page, and this runs as a microtask inside
  // React's view-transition update, so it names before the new snapshot.
  // Only what was just inserted counts: the new page, not the old.
  const observer = new MutationObserver((records) => {
    const added = records.flatMap((r) => [...r.addedNodes])
    const within = (el: Element) => added.some((n) => n.contains(el))
    const hero = () => heroOf(marked(within))
    const linking = () => {
      const a = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].find(
        (a) => within(a) && a.href.split('#')[0] === left
      )
      return a && (a.closest<HTMLElement>(MARKED) ?? a)
    }
    const to = back ? (linking() ?? hero()) : (hero() ?? linking())
    if (!to) return
    name(to)
    finish(to)
  })
  observer.observe(document.body, { childList: true, subtree: true })
  // A page change that never comes, or brings no partner: the old end
  // goes back to moving with its page.
  const timer = setTimeout(finish, 5000)
}
