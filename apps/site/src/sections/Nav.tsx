import { lazy, Suspense, useEffect, useState, type JSX } from 'react'
import {
  AppBar,
  Button,
  Container,
  Drawer,
  Hide,
  Icon,
  IconButton,
  Link,
  ScrollSpy,
  Segment,
  SegmentedControl,
  Show,
  Stack,
  Text,
  useColorScheme,
  type ColorScheme,
} from '@greese/react'
import { REPO_URL } from '../config.ts'
import { icons } from '../icons.tsx'
import { RouteLink, useCurrentRoute } from '../router.tsx'
import { useShell } from '../shell.ts'

// The header's theme menu and the studio's controls are chunks of their own:
// the homepage's first paint doesn't wait for them.
const ThemeSelector = lazy(() =>
  import('../studio/ThemeSelector.tsx').then((m) => ({ default: m.ThemeSelector }))
)
const StudioControls = lazy(() =>
  import('../studio/StudioControls.tsx').then((m) => ({ default: m.StudioControls }))
)
const InspectSwitch = lazy(() =>
  import('../studio/StudioControls.tsx').then((m) => ({ default: m.InspectSwitch }))
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

/** Below the sticky header (3.5rem) and the sections' scroll padding (5rem). */
const SPY_OFFSET = 100

const themePlaceholder = (
  <Button size="sm" variant="soft" tone="neutral" disabled>
    Theme
  </Button>
)

/**
 * The header, on every page: the wordmark and the links (the section the page
 * is on, or Studio or Templates, highlighted), then the theme menu, Replay motion, the color
 * scheme and GitHub; the studio page adds Inspect, Import and Save. Below md
 * the scheme and GitHub, then the links and Inspect, move into a drawer; the
 * theme menu, Replay, Import and Save stay in the bar.
 */
export const Nav = (): JSX.Element => {
  const { scheme, setScheme } = useColorScheme()
  const route = useCurrentRoute()
  const { replayMotion } = useShell()
  const idle = useIdle()
  const [menu, setMenu] = useState(false)
  const studio = route === 'studio'

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
  const studioControls = studio && (
    <Suspense>
      <StudioControls />
    </Suspense>
  )
  const inspect = studio && (
    <Suspense>
      <InspectSwitch />
    </Suspense>
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
      <Segment value="system">Auto</Segment>
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

  return (
    <AppBar sticky elevateOnScroll greese={{ enter: 'fadeDown', distance: '0.5rem' }}>
      <Container size={route === 'home' ? 'lg' : 'full'}>
        <Stack
          direction="row"
          align="center"
          justify="between"
          gap={{ xs: 2, sm: 4 }}
          className="site-nav"
        >
          <Stack direction="row" align="center" gap={5}>
            <Link
              asChild
              tone="neutral"
              underline="hover"
              className="site-wordmark"
              greese={{ hover: 'wobble' }}
            >
              <RouteLink to="home" hash={route === 'home' ? '#top' : ''}>
                <Text asChild variant="s2" weight="bold">
                  <span>greese</span>
                </Text>
              </RouteLink>
            </Link>
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
                    {links.map(([id, label]) => (
                      <Link
                        key={id}
                        asChild
                        tone="neutral"
                        underline="hover"
                        greese={{ hover: 'rise' }}
                      >
                        <RouteLink to="home" hash={`#${id}`}>
                          {label}
                        </RouteLink>
                      </Link>
                    ))}
                    <Link
                      asChild
                      tone="neutral"
                      underline="hover"
                      greese={{ hover: 'rise' }}
                    >
                      <RouteLink to="studio" aria-current={studioCurrent}>
                        Studio
                      </RouteLink>
                    </Link>
                    <Link
                      asChild
                      tone="neutral"
                      underline="hover"
                      greese={{ hover: 'rise' }}
                    >
                      <RouteLink to="templates" aria-current={templatesCurrent}>
                        Templates
                      </RouteLink>
                    </Link>
                  </nav>
                </Stack>
              </ScrollSpy>
            </Hide>
          </Stack>

          <Hide below="md">
            <Stack direction="row" align="center" gap={2}>
              {theme}
              {replay}
              {inspect}
              {studioControls}
              {colorScheme}
              {github}
            </Stack>
          </Hide>

          <Show below="md">
            <Stack direction="row" align="center" gap={{ xs: 1, sm: 2 }}>
              {theme}
              {replay}
              {studioControls}
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
        </Stack>
      </Container>

      <Drawer open={menu} onOpenChange={setMenu} title="Menu" hideTitle placement="end">
        <Stack gap={5}>
          <Stack direction="row" align="center" gap={2} wrap="wrap">
            {colorScheme}
            {github}
          </Stack>
          <ScrollSpy key={route} asChild offset={SPY_OFFSET}>
            <Stack asChild gap={0} className="site-menu-links">
              <nav aria-label="Sections">
                {links.map(([id, label]) => (
                  <Link key={id} asChild tone="neutral" underline="hover">
                    <RouteLink to="home" hash={`#${id}`} onClick={() => setMenu(false)}>
                      {label}
                    </RouteLink>
                  </Link>
                ))}
                <Link asChild tone="neutral" underline="hover">
                  <RouteLink
                    to="studio"
                    aria-current={studioCurrent}
                    onClick={() => setMenu(false)}
                  >
                    Studio
                  </RouteLink>
                </Link>
                <Link asChild tone="neutral" underline="hover">
                  <RouteLink
                    to="templates"
                    aria-current={templatesCurrent}
                    onClick={() => setMenu(false)}
                  >
                    Templates
                  </RouteLink>
                </Link>
              </nav>
            </Stack>
          </ScrollSpy>
          {inspect}
        </Stack>
      </Drawer>
    </AppBar>
  )
}
