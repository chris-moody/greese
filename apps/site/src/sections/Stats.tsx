import type { JSX } from 'react'
import { Card, Container, Grid, Stack, Text } from '@greese-ui/react'
import { facts, kB, metric, ratio } from '../data/index.ts'

interface Stat {
  value: string
  label: string
}

const script = metric('Main-thread script (load)')

const stats: Stat[] = [
  { value: String(facts.components), label: 'exported components' },
  { value: kB(facts.library.size), label: 'all of them, minified + brotli' },
  { value: kB(facts.greese.size), label: 'greese.js, the whole animation library' },
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
      greese={{ enter: 'fadeUp', stagger: 0.07, delay: 0.5 }}
    >
      {stats.map((s) => (
        <Card key={s.label} variant="filled" padding={4} greese={{ hover: 'lift' }}>
          <Stack gap={1}>
            <Text
              size="2xl"
              weight="bold"
              className="site-stat-value"
              greese={{ enter: 'blurIn', delay: 0.7 }}
            >
              {s.value}
            </Text>
            <Text size="sm" tone="muted">
              {s.label}
            </Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  </Container>
)
