import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type JSX,
  type PointerEvent,
} from 'react'
import {
  Accordion,
  AccordionItem,
  Button,
  Drawer,
  Header,
  Hide,
  Icon,
  IconButton,
  Link,
  ScrollSpy,
  Popover,
  Segment,
  SegmentedControl,
  Select,
  Show,
  Stack,
  Text,
  useColorScheme,
  useMediaQuery,
  type ColorScheme,
} from '@greese/react'
import { ChevronDownIcon } from '@greese/icons'
import { breakpoints } from '@greese/ui'
import { REPO_URL } from '../config.ts'
import { icons } from '../icons.tsx'
import { RouteLink, useCurrentRoute } from '../router.tsx'
import { TEMPLATES } from '../templates/index.ts'
import { SearchBox, SearchIconButton, useSearch } from '../search/Search.tsx'
import { useShell } from '../shell.ts'

// The header's theme menu is a chunk of its own: the homepage's first paint
// doesn't wait for it.
const ThemeSelector = lazy(() =>
  import('../studio/ThemeSelector.tsx').then((m) => ({ default: m.ThemeSelector }))
)

/**
 * True once the page has loaded and the browser is idle: the theme menu's
 * chunk (and the palette behind its swatches) is fetched then, so it never
 * competes with the first screen for the network or the main thread.
 */
const useIdle = (): boolean => {
  const [idle, setIdle] = useState(false)
  useEffect(() => {
    const ready = () =>
      'requestIdleCallback' in window
        ? requestIdleCallback(() => setIdle(true), { timeout: 4000 })
        : setTimeout(() => setIdle(true), 1500)
    if (document.readyState === 'complete') ready()
    else addEventListener('load', ready, { once: true })
    return () => removeEventListener('load', ready)
  }, [])
  return idle
}

const links = [
  ['why', 'Why'],
  ['size', 'Size'],
  ['speed', 'Speed'],
  ['motion', 'Motion'],
  ['components', 'Components'],
] as const

/**
 * Where a section counts as the one being read: a little below the sticky
 * header, whose height is also where in-page links land (Header sets the
 * page's scroll padding to it).
 */
const SPY_OFFSET = 100

const themePlaceholder = (
  <Button size="sm" variant="soft" tone="neutral" disabled>
    Theme
  </Button>
)

/**
 * The header, on every page: the wordmark and the links (the section the page
 * is on, or Studio or Templates, highlighted), then search, the theme menu,
 * Replay motion, the color scheme and GitHub. From md the wordmark goes home
 * and its arrow opens the homepage's sections. Below md search is an icon
 * and the scheme a select, beside the theme menu, Replay and GitHub, and the
 * pages and their sections are in a full-screen menu.
 */
export const Nav = (): JSX.Element => {
  const { scheme, setScheme } = useColorScheme()
  const route = useCurrentRoute()
  const { replayMotion } = useShell()
  const idle = useIdle()
  const [menu, setMenu] = useState(false)
  const studio = route === 'studio'
  const home = route === 'home'
  const wide = useMediaQuery(`(min-width: ${breakpoints.md}px)`)
  const search = useSearch()
  const openSearch = () => search.setOpen(true)

  const theme = (
    // The same button until the menu's chunk arrives, so nothing moves.
    <Suspense fallback={themePlaceholder}>
      {idle || studio ? <ThemeSelector /> : themePlaceholder}
    </Suspense>
  )
  const replay = (
    <IconButton size="sm" variant="soft" label="Replay motion" onClick={replayMotion}>
      <Icon>{icons.replay}</Icon>
    </IconButton>
  )
  const colorScheme = (
    <SegmentedControl
      label="Color scheme"
      hideLabel
      size="sm"
      value={scheme}
      onValueChange={(v) => setScheme(v as ColorScheme)}
      greese={{ enter: 'fadeIn', delay: 0.2 }}
    >
      <Segment value="light">
        <Icon label="Light">{icons.sun}</Icon>
      </Segment>
      <Segment value="system">
        <Icon label="Auto">{icons.auto}</Icon>
      </Segment>
      <Segment value="dark">
        <Icon label="Dark">{icons.moon}</Icon>
      </Segment>
    </SegmentedControl>
  )
  const github = (
    // IconButton can't be asChild (it wraps its child in the icon span), so the
    // link is a Button with the same class.
    <Button
      asChild
      size="sm"
      variant="ghost"
      tone="neutral"
      className="greese-IconButton"
      startIcon={<Icon>{icons.github}</Icon>}
      greese={{ enter: 'fadeIn', delay: 0.25, hover: 'rise' }}
    >
      <a href={REPO_URL} aria-label="GitHub" />
    </Button>
  )
  const studioCurrent = studio ? 'page' : undefined
  const templatesCurrent = route === 'templates' ? 'page' : undefined
  const close = () => setMenu(false)
  // The scheme as a select on phones, the width of an icon button: the native
  // select (its menu, keyboard and screen-reader name) under the current
  // scheme's icon.
  const schemeSelect = (
    <span className="site-scheme-select">
      <Select
        size="sm"
        aria-label="Color scheme"
        value={scheme}
        onChange={(e) => setScheme(e.currentTarget.value as ColorScheme)}
      >
        <option value="light">Light</option>
        <option value="system">Auto</option>
        <option value="dark">Dark</option>
      </Select>
      <Icon>
        {scheme === 'light' ? icons.sun : scheme === 'dark' ? icons.moon : icons.auto}
      </Icon>
    </span>
  )
  const navLink = (
    key: string,
    to: 'home' | 'studio' | 'templates',
    label: string,
    extra = {}
  ) => (
    <Link key={key} asChild tone="neutral" underline="hover" greese={{ hover: 'rise' }}>
      <RouteLink to={to} {...extra}>
        {label}
      </RouteLink>
    </Link>
  )

  return (
    <Header
      size={home ? 'lg' : 'full'}
      greese={{ enter: 'fadeDown', distance: '0.5rem' }}
      className="site-nav"
      brand={
        // From md the wordmark's arrow opens the homepage's sections; on
        // phones the menu has them, so it's the wordmark alone.
        wide ? <HomeMenu home={home} /> : <Wordmark home={home} />
      }
      actions={
        <>
          <Hide below="md">
            <Stack direction="row" align="center" gap={2}>
              <SearchBox open={search.open} onOpen={openSearch} />
              {theme}
              {replay}
              {colorScheme}
              {github}
            </Stack>
          </Hide>
          <Show below="md">
            <Stack direction="row" align="center" gap={{ xs: 1, sm: 2 }}>
              {theme}
              {schemeSelect}
              {replay}
              <SearchIconButton open={search.open} onOpen={openSearch} />
              {github}
              <IconButton
                size="sm"
                variant="soft"
                label="Menu"
                aria-expanded={menu}
                onClick={() => setMenu(true)}
              >
                <Icon>{icons.menu}</Icon>
              </IconButton>
            </Stack>
          </Show>
        </>
      }
    >
      <Hide below="md">
        {/* Remounted per route, so the homepage's highlight doesn't linger on the studio. */}
        <ScrollSpy key={route} asChild offset={SPY_OFFSET}>
          <Stack
            asChild
            direction="row"
            gap={1}
            className="site-nav-links"
            greese={{ enter: 'fadeIn', stagger: 0.05, delay: 0.1 }}
          >
            <nav aria-label="Sections">
              {/* Below lg they're in the wordmark's menu alone: the row has no room. */}
              {home &&
                links.map(([id, label]) =>
                  navLink(id, 'home', label, {
                    hash: `#${id}`,
                    className: 'site-nav-section',
                  })
                )}
              {navLink('studio', 'studio', 'Studio', { 'aria-current': studioCurrent })}
              {navLink('templates', 'templates', 'Templates', {
                'aria-current': templatesCurrent,
              })}
            </nav>
          </Stack>
        </ScrollSpy>
      </Hide>

      <Drawer
        open={menu}
        onOpenChange={setMenu}
        title="Menu"
        hideTitle
        placement="end"
        className="site-menu"
      >
        <Stack gap={5}>
          {/* Each page is a header over what's on it, its own link first. The
              header only opens and closes the list: a link inside it would be
              a control inside a control. */}
          <Accordion className="site-menu-nav">
            <AccordionItem defaultOpen={home} title="Home">
              <ScrollSpy key={route} asChild offset={SPY_OFFSET}>
                <Stack asChild gap={0} className="site-menu-links">
                  <nav aria-label="Sections">
                    <RouteLink to="home" hash="#top" onClick={close}>
                      Home
                    </RouteLink>
                    {links.map(([id, label]) => (
                      <RouteLink key={id} to="home" hash={`#${id}`} onClick={close}>
                        {label}
                      </RouteLink>
                    ))}
                  </nav>
                </Stack>
              </ScrollSpy>
            </AccordionItem>
            <AccordionItem defaultOpen={studio} title="Studio">
              <Stack asChild gap={0} className="site-menu-links">
                <nav aria-label="Studio">
                  <RouteLink to="studio" aria-current={studioCurrent} onClick={close}>
                    Theme Studio
                  </RouteLink>
                  {STUDIO_TABS.map(([tab, label]) => (
                    <RouteLink
                      key={tab}
                      to="studio"
                      search={`?tab=${tab}`}
                      onClick={close}
                    >
                      {label}
                    </RouteLink>
                  ))}
                </nav>
              </Stack>
            </AccordionItem>
            <AccordionItem defaultOpen={route === 'templates'} title="Templates">
              <Stack asChild gap={0} className="site-menu-links">
                <nav aria-label="Templates">
                  <RouteLink
                    to="templates"
                    aria-current={templatesCurrent}
                    onClick={close}
                  >
                    All templates
                  </RouteLink>
                  {TEMPLATES.map((t) => (
                    <RouteLink key={t.id} to="templates" page={t.id} onClick={close}>
                      {t.title}
                    </RouteLink>
                  ))}
                </nav>
              </Stack>
            </AccordionItem>
          </Accordion>
        </Stack>
      </Drawer>
      {search.dialog}
    </Header>
  )
}

const STUDIO_TABS = [
  ['tokens', 'Tokens'],
  ['components', 'Components'],
  ['shapes', 'Shapes'],
  ['motion', 'Motion'],
  ['code', 'Code'],
] as const

/** The wordmark: a link home, or to the top of the homepage. */
const Wordmark = ({ home }: { home: boolean }): JSX.Element => (
  <Link
    asChild
    tone="neutral"
    underline="hover"
    className="site-wordmark"
    greese={{ hover: 'wobble' }}
  >
    <RouteLink to="home" hash={home ? '#top' : ''}>
      <Text asChild variant="s2" weight="bold">
        <span>greese</span>
      </Text>
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
const HomeMenu = ({ home }: { home: boolean }): JSX.Element => {
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
        {links.map(([id, label]) => (
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
