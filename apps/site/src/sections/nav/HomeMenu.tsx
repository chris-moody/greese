import { useEffect, useRef, useState, type JSX, type PointerEvent } from 'react'
import { IconButton, Link, Popover, ScrollSpy, Stack } from '@greese/react'
import { ChevronDownIcon } from '@greese/icons'
import { WordmarkGlyphs } from '../../logo/Glyphs.tsx'
import { RouteLink } from '../../router.tsx'
import { SECTIONS, SPY_OFFSET } from './links.ts'

/** The wordmark: the logo's letters, a link home, or to the top of the homepage. */
export const Wordmark = ({ home }: { home: boolean }): JSX.Element => (
  <Link
    asChild
    tone="neutral"
    underline="hover"
    className="site-wordmark"
    greese={{ hover: 'wobble' }}
  >
    <RouteLink to="home" hash={home ? '#top' : ''}>
      <WordmarkGlyphs />
    </RouteLink>
  </Link>
)

/**
 * The wordmark from md: a link home, and beside it an arrow that opens a
 * menu of the homepage's sections. The menu opens as the pointer comes over
 * either, and closes a moment after it leaves both them and the menu, so
 * crossing the gap doesn't close it. The arrow (a click, Enter or Space)
 * toggles it; clicked while hover has it open, it keeps it open instead.
 */
export const HomeMenu = ({ home }: { home: boolean }): JSX.Element => {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Opened by hovering, and not yet clicked: leaving closes it.
  const byHover = useRef(false)
  const change = (next: boolean) => {
    clearTimeout(timer.current)
    if (!next) byHover.current = false
    setOpen(next)
  }
  useEffect(() => () => clearTimeout(timer.current), [])
  const hover = {
    onPointerEnter: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') return
      clearTimeout(timer.current)
      if (!open) byHover.current = true
      setOpen(true)
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse' || !byHover.current) return
      clearTimeout(timer.current)
      timer.current = setTimeout(() => change(false), 160)
    },
  }
  const close = () => change(false)
  const sections = (
    <Stack asChild gap={0} className="site-menu-links">
      <nav aria-label="Homepage sections">
        {SECTIONS.map(([id, label]) => (
          <RouteLink key={id} to="home" hash={`#${id}`} onClick={close}>
            {label}
          </RouteLink>
        ))}
      </nav>
    </Stack>
  )
  return (
    // The menu is inside this box in the DOM (in the top layer on screen), so
    // the pointer moving onto it hasn't left.
    <span className="site-home" {...hover}>
      <Wordmark home={home} />
      <Popover
        open={open}
        onOpenChange={change}
        placement="bottom-start"
        label="Homepage sections"
        className="site-home-menu"
        trigger={
          <IconButton
            size="sm"
            variant="ghost"
            tone="neutral"
            label="Homepage sections"
            className="site-home-toggle"
            onClick={(e) => {
              // The popover target would close what hover opened: keep it.
              if (open && byHover.current) {
                e.preventDefault()
                byHover.current = false
              }
            }}
          >
            <ChevronDownIcon />
          </IconButton>
        }
      >
        {home ? (
          <ScrollSpy asChild offset={SPY_OFFSET}>
            {sections}
          </ScrollSpy>
        ) : (
          sections
        )}
      </Popover>
    </span>
  )
}
