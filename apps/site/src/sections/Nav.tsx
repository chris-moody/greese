import { lazy, Suspense, type JSX } from 'react'
import {
  AppBar,
  Button,
  Container,
  Hide,
  Icon,
  Link,
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

const links = [
  ['why', 'Why'],
  ['size', 'Size'],
  ['speed', 'Speed'],
  ['motion', 'Motion'],
  ['components', 'Components'],
] as const

/**
 * The header, on every page: the wordmark, the section links and the Studio
 * link, then the theme menu, Replay motion and the color scheme; the studio
 * page adds Inspect, Import and Save.
 */
export const Nav = (): JSX.Element => {
  const { scheme, setScheme } = useColorScheme()
  const route = useCurrentRoute()
  const { replayMotion } = useShell()
  return (
    <AppBar sticky elevateOnScroll greese={{ enter: 'fadeDown', distance: '0.5rem' }}>
      <Container size={route === 'studio' ? 'full' : 'lg'}>
        <Stack
          direction="row"
          align="center"
          justify="between"
          gap={4}
          wrap="wrap"
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
              <Stack
                asChild
                direction="row"
                gap={5}
                greese={{ enter: 'fadeIn', stagger: 0.05, delay: 0.1 }}
              >
                <nav aria-label="Sections">
                  {links.map(([id, label]) => (
                    <Link
                      key={id}
                      asChild
                      tone="neutral"
                      underline="hover"
                      greese={{ hover: 'float' }}
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
                    greese={{ hover: 'float' }}
                  >
                    <RouteLink
                      to="studio"
                      aria-current={route === 'studio' ? 'page' : undefined}
                    >
                      Studio
                    </RouteLink>
                  </Link>
                </nav>
              </Stack>
            </Hide>
          </Stack>
          <Stack direction="row" align="center" gap={2} wrap="wrap">
            <Show below="md">
              <Button asChild size="sm" variant="ghost" tone="neutral">
                <RouteLink to="studio">Studio</RouteLink>
              </Button>
            </Show>
            <Suspense
              fallback={
                <Button size="sm" variant="soft" tone="neutral" disabled>
                  Theme
                </Button>
              }
            >
              <ThemeSelector />
            </Suspense>
            <Button
              size="sm"
              variant="soft"
              tone="neutral"
              onClick={replayMotion}
              startIcon={<Icon>{icons.replay}</Icon>}
            >
              Replay motion
            </Button>
            {route === 'studio' && (
              <Suspense>
                <StudioControls />
              </Suspense>
            )}
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
            <Button
              asChild
              size="sm"
              variant="ghost"
              tone="neutral"
              startIcon={<Icon>{icons.github}</Icon>}
              greese={{ enter: 'fadeIn', delay: 0.25, hover: 'lift' }}
            >
              <a href={REPO_URL}>GitHub</a>
            </Button>
          </Stack>
        </Stack>
      </Container>
    </AppBar>
  )
}
