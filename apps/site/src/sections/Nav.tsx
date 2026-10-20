import type { JSX } from 'react'
import {
  AppBar,
  Button,
  Container,
  Hide,
  Icon,
  Link,
  Segment,
  SegmentedControl,
  Stack,
  Text,
  useColorScheme,
  type ColorScheme,
} from '@greese/react'
import { REPO_URL } from '../config.ts'
import { icons } from '../icons.tsx'

const links = [
  ['#why', 'Why'],
  ['#size', 'Size'],
  ['#speed', 'Speed'],
  ['#motion', 'Motion'],
  ['#components', 'Components'],
] as const

export const Nav = (): JSX.Element => {
  const { scheme, setScheme } = useColorScheme()
  return (
    <AppBar sticky elevateOnScroll greese={{ enter: 'fadeDown', distance: '0.5rem' }}>
      <Container size="lg">
        <Stack
          direction="row"
          align="center"
          justify="between"
          gap={4}
          className="site-nav"
        >
          <Link
            href="#top"
            tone="neutral"
            underline="hover"
            className="site-wordmark"
            greese={{ hover: 'wobble' }}
          >
            <Text asChild variant="s2" weight="bold">
              <span>greese</span>
            </Text>
          </Link>
          <Hide below="md">
            <Stack
              asChild
              direction="row"
              gap={5}
              greese={{ enter: 'fadeIn', stagger: 0.05, delay: 0.1 }}
            >
              <nav aria-label="Sections">
                {links.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    tone="neutral"
                    underline="hover"
                    greese={{ hover: 'float' }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </Stack>
          </Hide>
          <Stack direction="row" align="center" gap={2}>
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
