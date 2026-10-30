import type { JSX, ReactNode } from 'react'
import { Card, Grid, Heading, Icon, Stack, Text } from '@greese/react'
import { facts, kB } from '../data/index.ts'
import { icons } from '../icons.tsx'
import { Section } from '../Section.tsx'
import { toneStyle } from '../tones.ts'

const reasons: Array<{ icon: ReactNode; title: string; body: string }> = [
  {
    icon: icons.layers,
    title: 'Zero-runtime CSS',
    body: 'Build time SCSS styles are themed with CSS custom properties. No CSS-in-JS, no style injection, no <style> tags at runtime.',
  },
  {
    icon: icons.feather,
    title: 'Light by design',
    body: `A Button is ${kB(facts.button.size)}; the full stylesheet is ${kB(facts.css.size)}.`,
  },
  {
    icon: icons.server,
    title: 'Server Components safe',
    body: 'Layout and text components render on the server with no client code, and entrance animations are CSS classes in the HTML.',
  },
  {
    icon: icons.access,
    title: 'Native and accessible',
    body: 'Semantic markup with native elements and inputs.',
  },
  {
    icon: icons.phone,
    title: 'Mobile first',
    body: 'Layouts, touch targets, spacing, font-sizes and more optimized for small screens',
  },
  {
    icon: icons.motion,
    title: 'Motion on every component',
    body: 'The `greese` prop manages entrance animations, scroll reveals, hover, press, and text effects and composed sequences.',
  },
]

export const Why = (): JSX.Element => (
  <Section
    id="why"
    eyebrow="Why greese"
    title="Its smooth"
    intro="greese is lightweight and keeps pages fast across devices."
  >
    <Grid
      container
      columns={{ xs: 1, sm: 2, lg: 3 }}
      gap={4}
      greese={{ inView: 'theme', stagger: 0.08, distance: '1.5rem' }}
    >
      {reasons.map((r, i) => (
        <Card key={r.title} padding={5} greese={{ hover: 'rise' }}>
          <Stack gap={3}>
            <Icon
              size="1.75rem"
              className="site-why-icon"
              style={toneStyle(i)}
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
