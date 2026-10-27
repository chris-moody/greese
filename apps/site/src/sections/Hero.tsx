import type { JSX } from 'react'
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  Code,
  Container,
  Grid,
  Heading,
  Icon,
  IconButton,
  Progress,
  Stack,
  Switch,
  Text,
  toast,
} from '@greese/react'
import { INSTALL } from '../config.ts'
import { facts, kB } from '../data/index.ts'
import { icons } from '../icons.tsx'
import { RouteLink } from '../router.tsx'

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast({ title: 'Copied', description: text, tone: 'positive', duration: 2500 })
  } catch {
    toast({ title: 'Couldn’t copy', description: 'Select the command instead.' })
  }
}

/**
 * A small "app" made of real components: the hero's illustration. Everything
 * on the first screen enters with CSS presets, which need no JavaScript, so
 * it's animating from the first paint while the runtime loads lazily for the
 * hover and press effects.
 */
const Preview = (): JSX.Element => (
  <Card
    variant="elevated"
    padding={5}
    className="site-preview"
    greese={{ enter: 'theme', delay: 0.35, duration: 0.7, distance: '2rem' }}
  >
    <Stack gap={4} greese={{ enter: 'theme', stagger: 0.08, delay: 0.55 }}>
      <Stack direction="row" justify="between" align="center">
        <Text weight="semibold">Release 1.0</Text>
        <Badge tone="positive" greese={{ enter: 'pop', delay: 1.1 }}>
          Shipped
        </Badge>
      </Stack>
      <Progress
        value={86}
        aria-label="Release checklist"
        className="site-grow"
        greese={{ enter: 'theme', delay: 0.9 }}
      />
      <Switch label="Motion for everyone" defaultChecked />
      <Stack direction="row" justify="between" align="center">
        <AvatarGroup
          max={3}
          size="sm"
          greese={{ enter: 'theme', stagger: 0.06, delay: 1 }}
        >
          <Avatar name="Ada Lovelace" />
          <Avatar name="Grace Hopper" />
          <Avatar name="Alan Turing" />
          <Avatar name="Edsger Dijkstra" />
        </AvatarGroup>
        <Button size="sm" greese={{ hover: 'rise', press: 'squish' }}>
          Review
        </Button>
      </Stack>
    </Stack>
  </Card>
)

export const Hero = (): JSX.Element => (
  <header id="top" className="site-hero">
    <Container size="lg">
      <Grid container columns={{ xs: 1, md: 2 }} gap={7} align="center">
        <Stack gap={5}>
          <div>
            <Badge tone="primary" variant="outline" greese={{ enter: 'pop' }}>
              React 19 · TypeScript · {facts.components} components
            </Badge>
          </div>
          <Heading level={1} variant="h1" className="site-hero-title">
            <Text asChild greese={{ enter: 'theme', delay: 0.1 }}>
              <span>Components that move,</span>
            </Text>{' '}
            <Text asChild tone="primary" greese={{ enter: 'theme', delay: 0.5 }}>
              <span>weigh almost nothing.</span>
            </Text>
          </Heading>
          <Text
            variant="s2"
            tone="muted"
            className="site-measure"
            // The page's largest paint: no delay, so it isn't held invisible.
            greese={{ enter: 'theme' }}
          >
            greese ui is a mobile-first React library with zero-runtime CSS, native
            elements underneath, and an animation prop on every component. The whole
            library is {kB(facts.library.size)} of JavaScript; a Button alone is{' '}
            {kB(facts.button.size)}.
          </Text>
          <Stack
            direction="row"
            gap={3}
            wrap="wrap"
            greese={{ enter: 'theme', stagger: 0.08, delay: 0.45 }}
          >
            <Button asChild size="lg" greese={{ hover: 'rise', press: 'squish' }}>
              <a href="#start">Get started</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              tone="neutral"
              greese={{ hover: 'rise', press: 'squish' }}
            >
              <RouteLink to="docs">Browse the docs</RouteLink>
            </Button>
          </Stack>
          <Stack
            direction="row"
            align="center"
            gap={2}
            className="site-install"
            greese={{ enter: 'theme', delay: 0.6 }}
          >
            <Code>{INSTALL}</Code>
            <IconButton
              label="Copy the install command"
              variant="ghost"
              size="sm"
              onClick={() => void copy(INSTALL)}
              greese={{ press: 'squish', hover: 'rise' }}
            >
              <Icon>{icons.copy}</Icon>
            </IconButton>
          </Stack>
        </Stack>
        <Preview />
      </Grid>
    </Container>
  </header>
)
