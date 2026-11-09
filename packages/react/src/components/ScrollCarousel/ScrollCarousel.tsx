'use client'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { flattenChildren } from '../../utils/children.ts'
import { cx } from '../../utils/cx.ts'
import { ChevronLeftIcon } from '@greese/icons'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import {
  neverToken,
  resolveResponsive,
  spaceToCss,
  type Responsive,
  type ResponsiveConfig,
  type SpaceValue,
} from '../../utils/responsive.ts'

const C = 'greese-ScrollCarousel'
// Always an inline variable, read by one class per breakpoint: a class per
// count and breakpoint cost 1.8 kB of CSS for no gain (ADR 0011).
const PER_VIEW: ResponsiveConfig = { block: C, prop: 'per-view', isToken: neverToken }

const SlideContext = createContext<{
  index: number
  count: number
  strip: boolean
} | null>(null)

export interface ScrollCarouselProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'section'>, 'onChange'> {
  /** Names the carousel ("Featured products"). */
  label: string
  /** The slide at the start of the view, from 0. */
  index?: number
  /** The slide shown first, from 0, when the carousel keeps its own state. */
  defaultIndex?: number
  /**
   * Called with the leading slide's index whenever it changes: by scrolling, the
   * buttons or the dots.
   */
  onIndexChange?: (index: number) => void
  /** Slides in view at once. A fraction (`1.2`) lets the next one peek in. @default 1 */
  perView?: Responsive<number>
  /** Space between slides: a scale token (`0`–`8`) or any CSS length. @default 3 */
  gap?: SpaceValue
  /** Previous and next buttons. @default true */
  controls?: boolean
  /** A dot per slide, to jump to it. @default true */
  indicators?: boolean
  /** Next on the last slide goes back to the first, and the reverse. @default false */
  loop?: boolean
  /** Accessible name of the previous button. @default 'Previous slide' */
  previousLabel?: string
  /** Accessible name of the next button. @default 'Next slide' */
  nextLabel?: string
  /**
   * The way the slides run. `vertical` stacks them in a viewport
   * `--greese-scrollcarousel-size` tall (20rem); the buttons sit above and
   * below. @default 'horizontal'
   */
  orientation?: ScrollCarouselOrientation
  /**
   * A strip of controls rather than slides: a tab row or a toolbar that
   * scrolls when it overflows. Each slide is as wide as its content, the
   * carousel's own roles, live region and focusable viewport are left out so
   * the controls inside keep theirs (tabs stay a tab list's), there are no
   * dots, and the buttons scroll by most of a view. The buttons are for the
   * pointer only: keys move through the controls, and the one focused scrolls
   * into view. `label` names the buttons: "Scroll <label> back".
   * @default false
   */
  strip?: boolean
}

export type ScrollCarouselOrientation = 'horizontal' | 'vertical'

/** The viewport's scroll position along its axis. */
const position = (el: HTMLElement, vertical: boolean) =>
  vertical ? el.scrollTop : el.scrollLeft

class NoObserver {
  observe() {}
  disconnect() {}
}

/**
 * Slides in a row (or a column, `orientation="vertical"`) that scroll with a
 * swipe, the trackpad or the keyboard, on native CSS scroll snapping. JavaScript only adds the buttons and dots and
 * tracks which slide is in view. It never moves on its own.
 *
 * ```tsx
 * <ScrollCarousel label="Featured" perView={{ xs: 1.15, md: 3 }}>
 *   <ScrollCarouselSlide><Card>…</Card></ScrollCarouselSlide>
 *   <ScrollCarouselSlide><Card>…</Card></ScrollCarouselSlide>
 * </ScrollCarousel>
 * ```
 */
export const ScrollCarousel = ({
  greese,
  label,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  perView,
  gap,
  controls = true,
  indicators = true,
  loop,
  strip = false,
  previousLabel = strip ? `Scroll ${label} back` : 'Previous slide',
  nextLabel = strip ? `Scroll ${label} forward` : 'Next slide',
  orientation = 'horizontal',
  className,
  children,
  ...props
}: ScrollCarouselProps): JSX.Element => {
  const viewportId = useId()
  const viewport = useRef<HTMLDivElement>(null)
  const slides = flattenChildren(children)
  const count = slides.length
  const [index, setIndex] = useControllableState({
    value: indexProp,
    defaultValue: defaultIndex,
    onChange: onIndexChange,
  })
  const [edges, setEdges] = useState({ start: true, end: count <= 1 })
  // Indexes the carousel reported itself (by observing the scroll, or in
  // go(), which scrolls on its own) since the view last settled or a move
  // last began. Only a controlled `index` the carousel didn't report scrolls
  // from the effect below: a parent echoing onIndexChange back, however late,
  // never pulls the view to a slide it has already passed.
  const reported = useRef(new Set<number>())
  const current = useRef(index)
  current.current = index

  // The slide a scroll is heading for, until it has arrived.
  const target = useRef<number | null>(null)

  const vertical = orientation === 'vertical'

  /**
   * Where the viewport's scroll position (scrollLeft, or scrollTop when
   * vertical) must be for a slide to lead the view.
   */
  const offsetOf = useCallback(
    (i: number): number | undefined => {
      const el = viewport.current
      const slide = el?.querySelectorAll<HTMLElement>(
        ':scope > .greese-ScrollCarouselSlide'
      )[i]
      if (!el || !slide) return undefined
      const css = getComputedStyle(el)
      const a = slide.getBoundingClientRect()
      const b = el.getBoundingClientRect()
      if (vertical)
        return Math.round(
          el.scrollTop + a.top - b.top - (parseFloat(css.scrollPaddingBlockStart) || 0)
        )
      const padding = parseFloat(css.scrollPaddingInlineStart) || 0
      return Math.round(
        el.scrollLeft +
          (css.direction === 'rtl'
            ? a.right - b.right + padding
            : a.left - b.left - padding)
      )
    },
    [vertical]
  )

  const scrollToSlide = useCallback(
    (i: number) => {
      const el = viewport.current
      const offset = offsetOf(i)
      if (!el || offset === undefined || Math.abs(position(el, vertical) - offset) <= 1)
        return
      target.current = i
      // Snapping is off while we scroll ourselves: with it on, any layout
      // change mid-scroll (a re-render anywhere on the page) makes browsers
      // re-snap and pull the view back a slide. check() turns it back on at
      // the target, which is a snap point, so nothing moves.
      el.style.scrollSnapType = 'none'
      // Smooth only where the stylesheet makes it so: it does unless motion
      // is reduced, by the system or by the app (ThemeProvider's `motion`).
      el.scrollTo({
        [vertical ? 'top' : 'left']: offset,
        behavior: getComputedStyle(el).scrollBehavior === 'smooth' ? 'smooth' : 'instant',
      })
    },
    [offsetOf, vertical]
  )

  // Which slide leads the view, and whether either end is reached.
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    const items = [
      ...el.querySelectorAll<HTMLElement>(':scope > .greese-ScrollCarouselSlide'),
    ]
    const visible = new Set<number>()
    // Without IntersectionObserver the dots just follow the buttons.
    const observer = new (globalThis.IntersectionObserver ?? NoObserver)(
      (entries) => {
        for (const entry of entries) {
          const i = items.indexOf(entry.target as HTMLElement)
          if (entry.intersectionRatio >= 0.6) visible.add(i)
          else visible.delete(i)
        }
        if (!visible.size) return
        const first = Math.min(...visible)
        if (first !== current.current) {
          reported.current.add(first)
          setIndex(first)
        }
      },
      { root: el, threshold: [0, 0.6, 1] }
    )
    for (const item of items) observer.observe(item)
    // A smooth scroll can be cut short: with mandatory snapping, browsers
    // re-snap when layout changes mid-scroll. Once scrolling goes quiet, a
    // move that didn't arrive finishes at once.
    let settle = 0
    const onScroll = () => {
      const at = Math.abs(position(el, vertical))
      const [size, length] = vertical
        ? [el.clientHeight, el.scrollHeight]
        : [el.clientWidth, el.scrollWidth]
      setEdges({ start: at <= 1, end: at + size >= length - 1 })
      clearTimeout(settle)
      settle = window.setTimeout(check, 150)
    }
    // Keeps the target until the view is there: a correction can itself be
    // re-snapped under load, so it's checked again, a few times at most.
    let tries = 0
    const check = () => {
      // Settled after a scroll of the user's own: what it reported is
      // history now, so a controlled `index` naming one of those slides
      // again (Back, then Next) is a move, not an echo.
      if (target.current === null) {
        reported.current.clear()
        return
      }
      const want = offsetOf(target.current)
      if (
        want === undefined ||
        Math.abs(position(el, vertical) - want) <= 1 ||
        ++tries > 3
      ) {
        target.current = null
        tries = 0
        el.style.scrollSnapType = ''
        reported.current.clear()
        return
      }
      // 'instant', not 'auto': auto defers to the CSS scroll-behavior: smooth.
      el.scrollTo({ [vertical ? 'top' : 'left']: want, behavior: 'instant' })
      clearTimeout(settle)
      settle = window.setTimeout(check, 150)
    }
    // The user taking over (a swipe, the wheel, the keys) cancels the move.
    const release = () => {
      target.current = null
      el.style.scrollSnapType = ''
    }
    onScroll()
    // Content or room changing (a tab added, the window narrowed) moves the ends.
    const resized = new (globalThis.ResizeObserver ?? NoObserver)(() => {
      const at = Math.abs(position(el, vertical))
      const [size, length] = vertical
        ? [el.clientHeight, el.scrollHeight]
        : [el.clientWidth, el.scrollWidth]
      setEdges({ start: at <= 1, end: at + size >= length - 1 })
    })
    resized.observe(el)
    for (const item of items) resized.observe(item)
    el.addEventListener('scroll', onScroll, { passive: true })
    for (const type of ['pointerdown', 'wheel', 'keydown'])
      el.addEventListener(type, release, { passive: true })
    return () => {
      clearTimeout(settle)
      observer.disconnect()
      resized.disconnect()
      el.removeEventListener('scroll', onScroll)
      for (const type of ['pointerdown', 'wheel', 'keydown'])
        el.removeEventListener(type, release)
    }
  }, [count, setIndex, offsetOf, vertical])

  // A move of the carousel's own: what it reported on the way here is stale,
  // so a later `index` naming one of those slides (Forward, Forward again
  // before the first has settled) moves too.
  const moveTo = useCallback(
    (i: number) => {
      reported.current.clear()
      reported.current.add(i)
      scrollToSlide(i)
    },
    [scrollToSlide]
  )

  // A controlled `index` from outside moves the view.
  useEffect(() => {
    if (indexProp !== undefined && !reported.current.has(indexProp)) moveTo(indexProp)
  }, [indexProp, moveTo])

  // A `defaultIndex` other than the first slide: start there, once. It's the
  // starting point by definition, so later changes to it don't move the view.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    if (indexProp === undefined && defaultIndex) scrollToSlide(defaultIndex)
  }, [indexProp, defaultIndex, scrollToSlide])

  /** A strip's buttons: most of a view along, toward the start or the end. */
  const page = (toward: 1 | -1) => {
    const el = viewport.current
    if (!el) return
    const rtl = getComputedStyle(el).direction === 'rtl'
    const by = (vertical ? el.clientHeight : el.clientWidth) * 0.8 * toward
    el.scrollBy({
      [vertical ? 'top' : 'left']: rtl && !vertical ? -by : by,
      behavior: getComputedStyle(el).scrollBehavior === 'smooth' ? 'smooth' : 'instant',
    })
  }

  const go = (target: number) => {
    const next = loop
      ? (target + count) % count
      : Math.max(0, Math.min(count - 1, target))
    setIndex(next)
    moveTo(next)
  }

  const resolved = resolveResponsive([[perView, PER_VIEW]], {
    style:
      gap === undefined
        ? undefined
        : ({ '--greese-scrollcarousel-gap': spaceToCss(gap) } as CSSProperties),
  })

  return withGreese(
    <section
      aria-roledescription={strip ? undefined : 'carousel'}
      aria-label={strip ? undefined : label}
      {...props}
      className={cx(C, vertical && `${C}--vertical`, strip && `${C}--strip`, className)}
    >
      <div
        id={viewportId}
        ref={viewport}
        // Focusable, so arrow keys scroll it; polite, so a new slide is read.
        // A strip's controls are focusable themselves, and aren't news.
        tabIndex={strip ? undefined : 0}
        aria-live={strip ? undefined : 'polite'}
        className={cx('greese-ScrollCarousel-viewport', resolved.className)}
        style={resolved.style}
      >
        {slides.map((slide, i) => (
          <SlideContext key={i} value={{ index: i, count, strip }}>
            {slide as ReactNode}
          </SlideContext>
        ))}
      </div>
      {controls && count > 1 && (
        <>
          <button
            type="button"
            className="greese-ScrollCarousel-control greese-ScrollCarousel-control--previous"
            aria-label={previousLabel}
            aria-controls={viewportId}
            aria-hidden={strip || undefined}
            tabIndex={strip ? -1 : undefined}
            disabled={!loop && edges.start}
            onClick={() => (strip ? page(-1) : go(index - 1))}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className="greese-ScrollCarousel-control greese-ScrollCarousel-control--next"
            aria-label={nextLabel}
            aria-controls={viewportId}
            aria-hidden={strip || undefined}
            tabIndex={strip ? -1 : undefined}
            disabled={!loop && edges.end}
            onClick={() => (strip ? page(1) : go(edges.end && loop ? 0 : index + 1))}
          >
            <ChevronLeftIcon />
          </button>
        </>
      )}
      {indicators && !strip && count > 1 && (
        <div className="greese-ScrollCarousel-indicators">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className="greese-ScrollCarousel-indicator"
              aria-label={`Slide ${i + 1}`}
              aria-controls={viewportId}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </section>,
    greese
  )
}

export interface ScrollCarouselSlideProps
  extends GreeseProps, ComponentPropsWithRef<'div'> {
  /** How the slide is announced. @default '<n> of <count>' */
  label?: string
}

/** One slide of a ScrollCarousel. */
export const ScrollCarouselSlide = ({
  greese,
  label,
  className,
  ...props
}: ScrollCarouselSlideProps): JSX.Element => {
  const slide = use(SlideContext)
  // A strip's slide only holds a control, which speaks for itself.
  const plain = slide?.strip
  return withGreese(
    <div
      role={plain ? undefined : 'group'}
      aria-roledescription={plain ? undefined : 'slide'}
      aria-label={
        plain
          ? label
          : (label ?? (slide ? `${slide.index + 1} of ${slide.count}` : undefined))
      }
      {...props}
      className={cx('greese-ScrollCarouselSlide', className)}
    />,
    greese
  )
}
