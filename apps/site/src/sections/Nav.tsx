import { lazy, Suspense, useEffect, useState, type JSX } from 'react'
import {
  Button,
  Header,
  Hide,
  Icon,
  IconButton,
  Link,
  Show,
  Stack,
  useMediaQuery,
} from '@greese/react'
import { breakpoints } from '@greese/ui'
import { REPO_URL } from '../config.ts'
import { icons } from '../icons.tsx'
import { whenIdle } from '../idle.ts'
import { RouteLink, useRoute } from '../router.tsx'
import { SearchBox, SearchIconButton, useSearch } from '../search/Search.tsx'
import { useShell } from '../shell.ts'
import { SchemeControl, SchemeSelect } from './nav/ColorScheme.tsx'
import { HomeMenu, Wordmark } from './nav/HomeMenu.tsx'
import { PhoneMenu } from './nav/PhoneMenu.tsx'

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
  useEffect(() => whenIdle(() => setIdle(true)), [])
  return idle
}

const themePlaceholder = (
  <Button size="sm" variant="soft" tone="neutral" disabled>
    Theme
  </Button>
)

/**
 * The header, on every page: the wordmark and the pages (Docs, Studio and
 * Templates, the current one highlighted), then search, the theme menu,
 * Replay motion, the color scheme and GitHub. From md the wordmark goes home
 * and its arrow opens the homepage's sections: they're not in the row, which
 * has room for the pages alone beside the controls. Below md search is an icon
 * and the scheme a select, beside the theme menu, Replay and GitHub, and the
 * pages and their sections are in a full-screen menu.
 */
export const Nav = (): JSX.Element => {
  const route = useRoute()
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
  const github = (
    <IconButton
      href={REPO_URL}
      size="sm"
      variant="soft"
      label="GitHub"
      greese={{ enter: 'fadeIn', delay: 0.25, hover: 'rise' }}
    >
      <Icon>{icons.github}</Icon>
    </IconButton>
  )
  const studioCurrent = studio ? 'page' : undefined
  const templatesCurrent = route === 'templates' ? 'page' : undefined
  const docsCurrent = route === 'docs' ? 'page' : undefined
  const navLink = (
    key: string,
    to: 'studio' | 'templates' | 'docs',
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
      // The homepage's width on every page, so the header never moves
      // between them.
      size="lg"
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
              <SchemeControl />
              {github}
            </Stack>
          </Hide>
          <Show below="md">
            <Stack direction="row" align="center" gap={{ xs: 1, sm: 2 }}>
              {theme}
              <SchemeSelect />
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
        <Stack
          asChild
          direction="row"
          gap={1}
          className="site-nav-links"
          greese={{ enter: 'fadeIn', stagger: 0.05, delay: 0.1 }}
        >
          <nav aria-label="Pages">
            {navLink('docs', 'docs', 'Docs', { 'aria-current': docsCurrent })}
            {navLink('studio', 'studio', 'Studio', { 'aria-current': studioCurrent })}
            {navLink('templates', 'templates', 'Templates', {
              'aria-current': templatesCurrent,
            })}
          </nav>
        </Stack>
      </Hide>

      <PhoneMenu open={menu} onOpenChange={setMenu} />
      {search.dialog}
    </Header>
  )
}
