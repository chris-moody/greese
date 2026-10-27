'use client'
import { useEffect, useRef, type ComponentPropsWithRef, type JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { composeRefs, Slot } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface ScrollSpyProps extends GreeseProps, ComponentPropsWithRef<'div'> {
  /**
   * How far below the top of the viewport (or of the box the sections scroll
   * in), in pixels, a section has to start to be the current one: a sticky
   * header's height, plus a little. Defaults to a third of that height.
   */
  offset?: number
  /** Called with the id of the section the page is on, or undefined above the first. */
  onActiveChange?: (id: string | undefined) => void
  /** Render your element (a `nav`, a list) instead of a div. */
  asChild?: boolean
}

/**
 * The section the page is on: the last one, in page order, whose top is at or
 * above `offset`. At the bottom of the page it's the last section, which may
 * be too short ever to reach `offset`.
 */
export const currentSection = (
  sections: ReadonlyArray<{ id: string; top: number }>,
  offset: number,
  atEnd = false
): string | undefined => {
  const ordered = [...sections].sort((a, b) => a.top - b.top)
  if (atEnd && ordered.length) return ordered[ordered.length - 1]!.id
  let current: string | undefined
  for (const section of ordered) if (section.top <= offset) current = section.id
  return current
}

/** The same-page `#id` links inside a root: other pages' anchors don't count. */
const spiedLinks = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLAnchorElement>('a[href*="#"]')].filter(
    (a) => a.hash.length > 1 && a.pathname === location.pathname
  )

const idOf = (a: HTMLAnchorElement) => decodeURIComponent(a.hash.slice(1))

/** The box an element scrolls in: its nearest scrolling ancestor, or the page. */
const scrollerOf = (el: Element): Element => {
  for (let box = el.parentElement; box; box = box.parentElement) {
    const { overflowY } = getComputedStyle(box)
    if (/auto|scroll/.test(overflowY) && box.scrollHeight > box.clientHeight) return box
  }
  return document.documentElement
}

/**
 * Marks the link to the section the page is scrolled to: every same-page
 * `#id` link inside gets `aria-current="location"` while its section is
 * current, so a table of contents or a header's links follow the reader.
 * The links can be anywhere inside, from any router. Sections that scroll
 * in a panel of their own are measured from the panel's top.
 *
 * ```tsx
 * <ScrollSpy asChild offset={80}>
 *   <nav aria-label="Sections">
 *     <a href="#install">Install</a>
 *     <a href="#usage">Usage</a>
 *   </nav>
 * </ScrollSpy>
 * ```
 */
export const ScrollSpy = ({
  greese,
  offset,
  onActiveChange,
  asChild,
  className,
  ref,
  ...props
}: ScrollSpyProps): JSX.Element => {
  const root = useRef<HTMLDivElement>(null)
  const onChange = useRef(onActiveChange)
  onChange.current = onActiveChange

  // JavaScript because the platform's version (`scroll-target-group` and
  // `:target-current`) is Chromium-only so far. The page's scroll, not an
  // IntersectionObserver: "the last section above the line" needs every
  // section's position, and a handful of rects per frame costs nothing.
  useEffect(() => {
    const el = root.current
    if (!el) return
    let frame = 0
    let active: string | undefined
    const update = () => {
      frame = 0
      const links = spiedLinks(el)
      const targets = links.flatMap((a) => document.getElementById(idOf(a)) ?? [])
      // Measured from the top of the box they scroll in: the viewport, or a
      // scrolling panel's own top.
      const box = targets[0] ? scrollerOf(targets[0]) : document.documentElement
      const page = box === document.documentElement
      const boxTop = page ? 0 : box.getBoundingClientRect().top
      const height = page ? innerHeight : box.clientHeight
      const sections = targets.map((target) => ({
        id: target.id,
        top: target.getBoundingClientRect().top - boxTop,
      }))
      const end =
        box.scrollTop > 0 && Math.ceil(box.scrollTop + height) >= box.scrollHeight
      const id = currentSection(sections, offset ?? height / 3, end)
      for (const a of links) {
        if (idOf(a) === id) a.setAttribute('aria-current', 'location')
        else if (a.getAttribute('aria-current') === 'location')
          a.removeAttribute('aria-current')
      }
      if (id !== active) {
        active = id
        onChange.current?.(id)
      }
    }
    const schedule = () => {
      frame ||= requestAnimationFrame(update)
    }
    update()
    // Captured, so a scrolling panel's scroll (which doesn't bubble) counts too.
    addEventListener('scroll', schedule, { passive: true, capture: true })
    addEventListener('resize', schedule)
    // Links added or retargeted inside (a router re-rendering them).
    const observer = new MutationObserver(schedule)
    observer.observe(el, { subtree: true, childList: true, attributeFilter: ['href'] })
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', schedule, { capture: true })
      removeEventListener('resize', schedule)
      observer.disconnect()
      for (const a of el.querySelectorAll('[aria-current="location"]'))
        a.removeAttribute('aria-current')
    }
  }, [offset])

  const Root = (asChild ? Slot : 'div') as typeof Slot
  return withGreese(
    <Root
      {...props}
      ref={composeRefs(root, ref)}
      className={cx('greese-ScrollSpy', className)}
    />,
    greese
  )
}
