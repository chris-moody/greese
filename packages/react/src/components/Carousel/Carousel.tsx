'use client'
import {
  createContext,
  isValidElement,
  use,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type JSX,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { ChevronLeftIcon } from '@greese/icons'
import { effectClass } from '@greese/ui/effect-classes'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { flattenChildren } from '../../utils/children.ts'
import { cx } from '../../utils/cx.ts'
import {
  withGreese,
  type GreeseEffectName,
  type GreeseProps,
} from '../../utils/greese.ts'

const C = 'greese-Carousel'

/** How slides change: an effect by name, or `'theme'` for the theme's role. */
export interface CarouselMotion {
  /**
   * How the arriving slide enters: an effect that ends at rest (`fadeIn`,
   * `pocketLeft`, `irisIn`…), or `'theme'` for the theme's `carousel` role.
   * @default 'theme'
   */
  enter?: GreeseEffectName | 'theme'
  /**
   * How the leaving slide goes: an effect that ends away from rest
   * (`fadeOut`, `pocketOutLeft`, `wipeOutUp`…), or `'theme'` for the theme's
   * `carousel-exit` role. @default 'theme'
   */
  exit?: GreeseEffectName | 'theme'
}

export interface CarouselProps
  extends
    GreeseProps,
    CarouselMotion,
    Omit<ComponentPropsWithRef<'section'>, 'onChange'> {
  /** Names the carousel ("Featured products"). */
  label: string
  /** The slide shown, from 0. Pair with `onIndexChange`. */
  index?: number
  /** The slide shown first, from 0, when the carousel keeps its own state. @default 0 */
  defaultIndex?: number
  /**
   * Called with the new slide's index when it changes: by the buttons, the
   * dots, a swipe, the keys or the URL's hash.
   */
  onIndexChange?: (index: number) => void
  /**
   * Going back (Previous, an earlier dot): what changes from `enter` and
   * `exit`. Where a side follows the theme, it plays the `carousel-back`
   * and `carousel-back-exit` roles.
   */
  back?: CarouselMotion
  /**
   * Writes the shown slide's `id` to the URL's hash as it changes (with
   * `replaceState`, so moving between slides adds no history), so the
   * address always links to it. Slides with an `id` are deep-linkable
   * either way. @default false
   */
  syncHash?: boolean
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
}

interface SlideState {
  index: number
  count: number
  active: boolean
  /** On the slide that is leaving: its exit effect's class. */
  exitClass?: string
  /** On the slide that is arriving: its entrance. */
  enterStyle?: CSSProperties
}

const SlideContext = createContext<SlideState | null>(null)

type Direction = 'forward' | 'back'

/** What a move asked for, read when the index changes. */
interface Intent {
  direction?: Direction
  /** Shown at once, with no transition: the slide a deep link opens on. */
  silent?: boolean
}

/** A pointer that travels this far across, more than down, is a swipe. */
const SWIPE = 40

const slideId = (slide: ReactNode): string | undefined =>
  isValidElement<{ id?: string }>(slide) ? slide.props.id : undefined

/** The slide the URL's hash names, if any. */
const fromHash = (ids: readonly (string | undefined)[]): number => {
  const hash = decodeURIComponent(location.hash.slice(1))
  return hash ? ids.indexOf(hash) : -1
}

/**
 * Slides shown one at a time, changing with greese effects: the arriving one
 * plays an entrance and the leaving one an exit, by name or the theme's
 * `carousel` roles (a slide the way it moves). A slide with an `id` is
 * deep-linkable: a page opened on `#that-id` shows it before the first
 * paint, with no transition, and a link to it moves there.
 *
 * ```tsx
 * <Carousel label="Tour" enter="fadeIn" exit="fadeOut" syncHash>
 *   <CarouselSlide id="welcome">…</CarouselSlide>
 *   <CarouselSlide id="setup">…</CarouselSlide>
 * </Carousel>
 * ```
 */
export const Carousel = ({
  greese,
  label,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  enter,
  exit,
  back,
  syncHash = false,
  controls = true,
  indicators = true,
  loop = false,
  previousLabel = 'Previous slide',
  nextLabel = 'Next slide',
  className,
  children,
  ...props
}: CarouselProps): JSX.Element => {
  const viewportId = useId()
  const slides = flattenChildren(children)
  const count = slides.length
  const ids = slides.map(slideId)
  const [index, setIndex] = useControllableState({
    value: indexProp,
    defaultValue: defaultIndex,
    onChange: onIndexChange,
  })
  const [intent, setIntent] = useState<Intent | null>(null)
  // The slide last shown and how the carousel got there, updated while
  // rendering when the index changes, so the leaving slide and the
  // direction arrive in the same render as the new slide.
  const [view, setView] = useState({
    index,
    leaving: null as number | null,
    direction: 'forward' as Direction,
    moved: false,
  })
  if (view.index !== index) {
    setView({
      index,
      leaving: intent?.silent ? null : view.index,
      direction: intent?.direction ?? (index > view.index ? 'forward' : 'back'),
      moved: view.moved || !intent?.silent,
    })
    setIntent(null)
  }

  const clamp = (i: number) =>
    loop ? (i + count) % count : Math.max(0, Math.min(count - 1, i))

  const go = (target: number, direction?: Direction) => {
    const next = clamp(target)
    if (next === index) return
    setIntent({ direction })
    setIndex(next)
    const id = ids[next]
    if (syncHash && id)
      history.replaceState(history.state, '', `#${encodeURIComponent(id)}`)
  }

  // Opening on a deep link: before the first paint, so it's simply there.
  // A server can't see the hash; a server-rendered page shows `defaultIndex`
  // until it hydrates (pass `defaultIndex` from the request to avoid that).
  const idsKey = ids.join('\n')
  useLayoutEffect(() => {
    const i = fromHash(idsKey.split('\n'))
    if (i < 0) return
    setIntent({ silent: true })
    setIndex(i)
    // Only on mount: later hash changes animate (below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A link to a slide (`<a href="#setup">`), or back and forward through
  // hashes, moves there.
  const goTo = useRef<(i: number) => void>(null)
  goTo.current = (i) => go(i)
  useEffect(() => {
    const onHashChange = () => {
      const i = fromHash(idsKey.split('\n'))
      if (i >= 0) goTo.current?.(i)
    }
    addEventListener('hashchange', onHashChange)
    return () => removeEventListener('hashchange', onHashChange)
  }, [idsKey])

  const rtl = (el: HTMLElement) => getComputedStyle(el).direction === 'rtl'

  // The APG carousel keys, on the focused viewport: arrows (mirrored
  // right-to-left), Home and End.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const flip = rtl(event.currentTarget) ? -1 : 1
    const step = { ArrowRight: flip, ArrowLeft: -flip }[event.key]
    if (step) go(index + step, step > 0 ? 'forward' : 'back')
    else if (event.key === 'Home') go(0, 'back')
    else if (event.key === 'End') go(count - 1, 'forward')
    else return
    event.preventDefault()
  }

  // Swipes, by touch or pen: the platform has no gesture for content that
  // doesn't scroll. A mouse drag stays a text selection.
  const start = useRef<{ x: number; y: number } | null>(null)
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    start.current =
      event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY }
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const from = start.current
    start.current = null
    if (!from) return
    const dx = event.clientX - from.x
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(event.clientY - from.y)) return
    // A swipe leftward is next, in left-to-right.
    const forward = dx < 0 !== rtl(event.currentTarget)
    go(index + (forward ? 1 : -1), forward ? 'forward' : 'back')
  }

  const motion =
    view.direction === 'back'
      ? { enter: back?.enter ?? enter, exit: back?.exit ?? exit }
      : { enter, exit }
  const named = (name: string | undefined) =>
    name && name !== 'theme' ? effectClass(name) : undefined
  const entrance = named(motion.enter)
  const leave = named(motion.exit)

  return withGreese(
    <section
      aria-roledescription="carousel"
      aria-label={label}
      {...props}
      className={cx(C, className)}
      data-direction={view.direction}
      data-moved={view.moved || undefined}
    >
      <div
        id={viewportId}
        // Focusable, for the keys; polite, so a new slide is read.
        tabIndex={0}
        aria-live="polite"
        className="greese-Carousel-viewport"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (start.current = null)}
      >
        {slides.map((slide, i) => (
          <SlideContext
            key={i}
            value={{
              index: i,
              count,
              active: i === index,
              exitClass:
                i === view.leaving && i !== index && leave
                  ? `greese-Motion--exit-${leave}`
                  : undefined,
              enterStyle:
                i === index && entrance
                  ? ({
                      '--greese-carousel-slide-enter': `greese-${entrance}`,
                    } as CSSProperties)
                  : undefined,
            }}
          >
            {slide as ReactNode}
          </SlideContext>
        ))}
      </div>
      {controls && count > 1 && (
        <>
          <button
            type="button"
            className="greese-Carousel-control greese-Carousel-control--previous"
            aria-label={previousLabel}
            aria-controls={viewportId}
            disabled={!loop && index === 0}
            onClick={() => go(index - 1, 'back')}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className="greese-Carousel-control greese-Carousel-control--next"
            aria-label={nextLabel}
            aria-controls={viewportId}
            disabled={!loop && index === count - 1}
            onClick={() => go(index + 1, 'forward')}
          >
            <ChevronLeftIcon />
          </button>
        </>
      )}
      {indicators && count > 1 && (
        <div className="greese-Carousel-indicators">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className="greese-Carousel-indicator"
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

export interface CarouselSlideProps extends GreeseProps, ComponentPropsWithRef<'div'> {
  /**
   * Makes the slide deep-linkable: a page opened on `#<id>` shows it, a link
   * to `#<id>` moves to it, and `syncHash` writes it as it's shown.
   */
  id?: string
  /** How the slide is announced. @default '<n> of <count>' */
  label?: string
}

/** One slide of a Carousel. Only the shown one is interactive; the rest are inert. */
export const CarouselSlide = ({
  greese,
  label,
  className,
  style,
  ...props
}: CarouselSlideProps): JSX.Element => {
  const slide = use(SlideContext)
  return withGreese(
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={label ?? (slide ? `${slide.index + 1} of ${slide.count}` : undefined)}
      {...props}
      inert={slide ? !slide.active : undefined}
      data-active={slide?.active || undefined}
      className={cx('greese-CarouselSlide', slide?.exitClass, className)}
      style={slide?.enterStyle ? { ...slide.enterStyle, ...style } : style}
    />,
    greese
  )
}
