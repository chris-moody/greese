import type { JSX } from 'react'
import { Card, Container, Grid, Stack, Text } from '@greese/react'
import { facts, kB, metric, ratio } from '../data/index.ts'
import { toneStyle } from '../tones.ts'

interface Stat {
  value: string
  label: string
}

const script = metric('Main-thread script (load)')

const stats: Stat[] = [
  { value: String(facts.components), label: 'exported components' },
  { value: kB(facts.libraryWithGreese.size), label: 'full library, minified + brotli' },
  //{ value: kB(facts.greese.size), label: 'greese.js, the whole animation library' },
  {
    value: String(facts.thirdPartyDependencies),
    label: 'third-party runtime dependencies',
  },
  {
    value: `${ratio(script).toFixed(1)}×`,
    label: 'less main-thread script than MUI on load',
  },
]

export const Stats = (): JSX.Element => (
  <Container size="lg" className="site-stats">
    {/* At the fold, so CSS entrances (`enter`): no JavaScript before first paint. */}
    <Grid
      container
      columns={{ xs: 2, md: 5 }}
      gap={3}
      greese={{ enter: 'theme', stagger: 0.07, delay: 0.5 }}
    >
      {stats.map((s, i) => (
        <Card key={s.label} variant="filled" padding={4} greese={{ hover: 'rise' }}>
          <Stack gap={1}>
            <Text
              variant="h3"
              weight="bold"
              className="site-stat-value"
              style={toneStyle(i)}
              greese={{ enter: 'blurIn', delay: 0.7 }}
            >
              {s.value}
            </Text>
            <Text variant="p3" tone="muted">
              {s.label}
            </Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  </Container>
)
