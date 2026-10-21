import type { JSX, ReactNode } from 'react'
import { Card, Grid, Heading, Icon, Stack, Text } from '@greese/react'
import { facts, kB } from '../data/index.ts'
import { icons } from '../icons.tsx'
import { Section } from '../Section.tsx'

const reasons: Array<{ icon: ReactNode; title: string; body: string }> = [
  {
    icon: icons.layers,
    title: 'Zero-runtime CSS',
    body: 'Styles are SCSS compiled at build time and themed with CSS custom properties. No CSS-in-JS, no style injection, no <style> tags at runtime.',
  },
  {
    icon: icons.feather,
    title: 'Light by budget',
    body: `Every component has a size budget that fails CI when exceeded. A Button is ${kB(facts.button.size)}; the full stylesheet is ${kB(facts.css.size)}.`,
  },
  {
    icon: icons.server,
    title: 'Server Components safe',
    body: 'Layout and text components render on the server with no client code, and entrance animations are CSS classes in the HTML.',
  },
  {
    icon: icons.access,
    title: 'Native and accessible',
    body: 'Real <dialog>, the Popover API, <details> and native inputs underneath, so focus, keyboard and autofill work as the platform intends.',
  },
  {
    icon: icons.phone,
    title: 'Mobile first',
    body: 'Touch targets of at least 44px, 16px control text so iOS never zooms, bottom-sheet drawers and responsive props on every layout.',
  },
  {
    icon: icons.motion,
    title: 'Motion on every component',
    body: 'One greese prop for entrances, scroll reveals, hover and press, text effects and composed sequences, all respecting reduced motion.',
  },
]

export const Why = (): JSX.Element => (
  <Section
    id="why"
    eyebrow="Why greese"
    title="The platform does the heavy lifting"
    intro="GreeseUI adds JavaScript only where the browser has nothing to offer, so pages stay fast on mid-range phones."
  >
    <Grid
      container
      columns={{ xs: 1, sm: 2, lg: 3 }}
      gap={4}
      greese={{ inView: 'fadeUp', stagger: 0.08, distance: '1.5rem' }}
    >
      {reasons.map((r) => (
        <Card key={r.title} padding={5} greese={{ hover: 'rise' }}>
          <Stack gap={3}>
            <Icon
              size="1.75rem"
              className="site-why-icon"
              greese={{ inView: 'pop', delay: 0.2 }}
            >
              {r.icon}
            </Icon>
            <Heading level={3} variant="h5">
              {r.title}
            </Heading>
            <Text tone="muted">{r.body}</Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  </Section>
)
