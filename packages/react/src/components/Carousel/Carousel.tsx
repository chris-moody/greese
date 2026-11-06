'use client'
import {
  createContext,
  use,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type JSX,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { ChevronLeftIcon } from '@greese/icons'
import { effectClass } from '@greese/ui/effect-classes'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { flattenChildren } from '../../utils/children.ts'
import { Slot } from '../Slot/Slot.tsx'
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
   * Called with the new slide's index when the user moves it: by the
   * buttons, the dots, a swipe or the keys. Where the address should follow
   * (a route, a hash), write it here.
   */
  onIndexChange?: (index: number) => void
  /**
   * Going back (Previous, an earlier dot): what changes from `enter` and
   * `exit`. Where a side follows the theme, it plays the `carousel-back`
   * and `carousel-back-exit` roles.
   */
  back?: CarouselMotion
  /**
   * Previous and next buttons. Or your own controls: anything, placed where
   * the buttons go, that can use `CarouselPrevious` and `CarouselNext`.
   * @default true
   */
  controls?: boolean | ReactNode
  /**
   * A dot per slide, to jump to it. Or your own: anything, placed where the
   * dots go, that can use `CarouselIndicator`. @default true
   */
  indicators?: boolean | ReactNode
  /**
   * Reads the new slide out as it's shown (the viewport is a polite live
   * region). Turn it off when the page announces slide changes itself.
   * @default true
   */
  announce?: boolean
  /** Next on the last slide goes back to the first, and the reverse. @default false */
  loop?: boolean
  /**
   * Accessible name of the previous button, and of any `CarouselPrevious`
   * that doesn't name itself. @default 'Previous slide'
   */
  previousLabel?: string
  /**
   * Accessible name of the next button, and of any `CarouselNext` that
   * doesn't name itself. @default 'Next slide'
   */
  nextLabel?: string
  /**
   * How each slide is announced, from its index (from 0) and the number of
   * slides; a slide's own `label` wins. @default (i, count) => `${i + 1} of ${count}`
   */
  slideLabel?: (index: number, count: number) => string
  /**
   * Accessible name of each dot, from its slide's index (from 0) and the
   * number of slides. @default (i) => `Slide ${i + 1}`
   */
  indicatorLabel?: (index: number, count: number) => string
}

const ofCount = (i: number, count: number) => `${i + 1} of ${count}`
const slideN = (i: number) => `Slide ${i + 1}`

interface SlideState {
  /** The announced name, unless the slide has its own. */
  label: string
  active: boolean
  /** On the slide that is leaving: its exit effect's class. */
  exitClass?: string
  /** On the slide that is arriving: its entrance. */
  enterStyle?: CSSProperties
}

const SlideContext = createContext<SlideState | null>(null)

type Direction = 'forward' | 'back'

/** What the controls and dots need: where the carousel is, and a way to move it. */
interface CarouselState {
  index: number
  count: number
  loop: boolean
  viewportId: string
  previousLabel: string
  nextLabel: string
  indicatorLabel: (index: number, count: number) => string
  go: (target: number, direction?: Direction) => void
}

const CarouselContext = createContext<CarouselState | null>(null)

const useCarousel = (): CarouselState => {
  const state = use(CarouselContext)
  if (!state) throw new Error("A Carousel's controls and dots must be inside a Carousel.")
  return state
}

/** What a move asked for: the slide, and which way to play it. */
interface Intent {
  to: number
  direction?: Direction
}

/** A pointer that travels this far across, more than down, is a swipe. */
const SWIPE = 40

/**
 * Slides shown one at a time, changing with greese effects: the arriving one
 * plays an entrance and the leaving one an exit, by name or the theme's
 * `carousel` roles (a slide the way it moves). It renders the slide it's
 * given from the first paint, with no transition, so deep links are the
 * app's: pass the slide a route names as `defaultIndex` (or a controlled
 * `index`), and update the address in `onIndexChange`.
 *
 * ```tsx
 * <Carousel label="Tour" enter="fadeIn" exit="fadeOut" defaultIndex={stop}>
 *   <CarouselSlide>…</CarouselSlide>
 *   <CarouselSlide>…</CarouselSlide>
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
  controls = true,
  indicators = true,
  announce = true,
  loop = false,
  previousLabel = 'Previous slide',
  nextLabel = 'Next slide',
  slideLabel = ofCount,
  indicatorLabel = slideN,
  className,
  children,
  ...props
}: CarouselProps): JSX.Element => {
  const viewportId = useId()
  const slides = flattenChildren(children)
  const count = slides.length
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
      leaving: view.index,
      // The way a move asked for, if it's the move that landed: a controlled
      // parent may have gone elsewhere, or nowhere and then somewhere else.
      direction:
        (intent?.to === index && intent.direction) ||
        (index > view.index ? 'forward' : 'back'),
      moved: true,
    })
    setIntent(null)
  }

  const clamp = (i: number) =>
    loop ? (i + count) % count : Math.max(0, Math.min(count - 1, i))

  const go = (target: number, direction?: Direction) => {
    if (!count) return
    const next = clamp(target)
    if (next === index) return
    setIntent({ to: next, direction })
    setIndex(next)
  }

  const rtl = (el: HTMLElement) => getComputedStyle(el).direction === 'rtl'

  // The APG carousel keys, on the focused viewport: arrows (mirrored
  // right-to-left), Home and End. Only keys aimed at the viewport itself: a
  // slider or text field inside a slide keeps its own. With Alt, Ctrl or Cmd
  // they're the browser's (Alt+Left is back).
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.altKey || event.ctrlKey || event.metaKey) return
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

  const state: CarouselState = {
    index,
    count,
    loop,
    viewportId,
    previousLabel,
    nextLabel,
    indicatorLabel,
    go,
  }
  const custom = (part: boolean | ReactNode) => typeof part !== 'boolean'

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
        aria-live={announce ? 'polite' : 'off'}
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
              label: slideLabel(i, count),
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
      <CarouselContext value={state}>
        {custom(controls)
          ? controls
          : controls &&
            count > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            )}
        {custom(indicators)
          ? indicators
          : indicators &&
            count > 1 && (
              <div className="greese-Carousel-indicators">
                {slides.map((_, i) => (
                  <CarouselIndicator key={i} index={i} />
                ))}
              </div>
            )}
      </CarouselContext>
    </section>,
    greese
  )
}

export interface CarouselControlProps
  extends GreeseProps, ComponentPropsWithRef<'button'> {
  /**
   * Renders your element instead (a router link, say), with the control's
   * wiring but not its look: at the end it gets `aria-disabled` and
   * `data-disabled` to style, not `disabled`, and names itself. A link
   * (`<a href>`) never moves the carousel itself: it navigates, and the
   * carousel follows the controlled `index` your router gives it. Any other
   * element moves it on click.
   */
  asChild?: boolean
}

/**
 * A control or dot: a button with the carousel's class and wiring, or your
 * element with only the wiring. `to` picks the slide it moves to.
 */
const CarouselPart = ({
  part,
  to,
  current,
  defaultLabel,
  greese,
  asChild,
  className,
  onClick,
  ref,
  ...props
}: CarouselControlProps & {
  part: string
  to: (state: CarouselState) => [number, Direction?, boolean?]
  current?: boolean
  /** Its accessible name, unless it's your element or names itself. */
  defaultLabel: (state: CarouselState) => string
}): JSX.Element => {
  const state = useCarousel()
  const [target, direction, atEnd] = to(state)
  const move = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    // A link moves by navigating. A router link prevents the default only
    // after this runs, so moving here too would move twice.
    if (event.defaultPrevented || event.currentTarget.matches('a[href]')) return
    state.go(target, direction)
  }
  const wiring = {
    'aria-controls': state.viewportId,
    'aria-current': current ? ('true' as const) : undefined,
  }
  return withGreese(
    asChild ? (
      <Slot
        {...wiring}
        // Not `disabled`: a link can't be, and a disabled button can't be
        // focused, which would drop focus to the page at the last slide.
        aria-disabled={atEnd || undefined}
        data-disabled={atEnd || undefined}
        {...(props as object)}
        className={className}
        ref={ref as Ref<HTMLElement>}
        onClick={move as (event: MouseEvent<HTMLElement>) => void}
      />
    ) : (
      <button
        type="button"
        {...wiring}
        // Text names it; an icon, or nothing, takes the carousel's label.
        aria-label={typeof props.children === 'string' ? undefined : defaultLabel(state)}
        disabled={atEnd}
        {...props}
        ref={ref}
        className={cx(part, className)}
        onClick={move}
      />
    ),
    greese
  )
}

const step =
  (way: 1 | -1) =>
  ({ index, count, loop }: CarouselState): [number, Direction, boolean] => [
    index + way,
    way > 0 ? 'forward' : 'back',
    !loop && index === (way > 0 ? count - 1 : 0),
  ]

/**
 * The previous control, for a Carousel's own `controls`. A button, disabled
 * on the first slide (unless the carousel loops), or your element with
 * `asChild`. With no children it's the carousel's own: a chevron, named by
 * its `previousLabel`. Text children name it themselves.
 */
export const CarouselPrevious = ({
  children = <ChevronLeftIcon />,
  ...props
}: CarouselControlProps): JSX.Element => (
  <CarouselPart
    part="greese-Carousel-control greese-Carousel-control--previous"
    to={step(-1)}
    defaultLabel={(state) => state.previousLabel}
    {...props}
  >
    {children}
  </CarouselPart>
)

/**
 * The next control, for a Carousel's own `controls`. A button, disabled on
 * the last slide (unless the carousel loops), or your element with
 * `asChild`. With no children it's the carousel's own: a chevron, named by
 * its `nextLabel`. Text children name it themselves.
 */
export const CarouselNext = ({
  children = <ChevronLeftIcon />,
  ...props
}: CarouselControlProps): JSX.Element => (
  <CarouselPart
    part="greese-Carousel-control greese-Carousel-control--next"
    to={step(1)}
    defaultLabel={(state) => state.nextLabel}
    {...props}
  >
    {children}
  </CarouselPart>
)

export interface CarouselIndicatorProps extends CarouselControlProps {
  /** The slide it shows, from 0. */
  index: number
}

/**
 * A dot that jumps to one slide, for a Carousel's own `indicators`: marked
 * `aria-current` on the slide shown, and named by the carousel's
 * `indicatorLabel`. A button, or your element with `asChild` (which then
 * names itself).
 */
export const CarouselIndicator = ({
  index,
  ...props
}: CarouselIndicatorProps): JSX.Element => {
  const shown = use(CarouselContext)?.index
  return (
    <CarouselPart
      part="greese-Carousel-indicator"
      to={() => [index]}
      current={index === shown}
      defaultLabel={(state) => state.indicatorLabel(index, state.count)}
      {...props}
    />
  )
}

export interface CarouselSlideProps extends GreeseProps, ComponentPropsWithRef<'div'> {
  /** How the slide is announced. @default the carousel's `slideLabel` ('<n> of <count>') */
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
      aria-label={label ?? slide?.label}
      {...props}
      inert={slide ? !slide.active : undefined}
      data-active={slide?.active || undefined}
      className={cx('greese-CarouselSlide', slide?.exitClass, className)}
      style={slide?.enterStyle ? { ...slide.enterStyle, ...style } : style}
    />,
    greese
  )
}
