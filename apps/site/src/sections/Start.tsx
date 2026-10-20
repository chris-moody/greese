import type { JSX } from 'react'
import { Badge, Button, Card, Code, Grid, Heading, Stack, Text } from '@greese/react'
import { DOCS_URL, INSTALL } from '../config.ts'
import { RouteLink } from '../router.tsx'
import { Section } from '../Section.tsx'

const steps = [
  { title: 'Install', code: INSTALL },
  {
    title: 'Add the styles once',
    code: `import '@greese/react/base.css'\nimport '@greese/react/styles.css'`,
  },
  {
    title: 'Build, and add motion',
    code: `import { Button, Card } from '@greese/react'\n\n<Card greese={{ inView: 'fadeUp' }}>\n  <Button greese={{ hover: 'lift' }}>Ship it</Button>\n</Card>`,
  },
]

export const Start = (): JSX.Element => (
  <Section
    id="start"
    eyebrow="Get started"
    title="Three steps, no providers"
    intro="Requires React 19. No context provider, no CSS-in-JS setup, no build plugin."
  >
    <Grid
      container
      columns={{ xs: 1, md: 3 }}
      gap={4}
      greese={{ inView: 'fadeUp', stagger: 0.1 }}
    >
      {steps.map((step, i) => (
        <Card key={step.title} padding={5} greese={{ hover: 'lift' }}>
          <Stack gap={3}>
            <div>
              <Badge
                tone="primary"
                variant="solid"
                greese={{ inView: 'pop', delay: 0.2 + i * 0.1 }}
              >
                {i + 1}
              </Badge>
            </div>
            <Heading level={3} variant="h5">
              {step.title}
            </Heading>
            <Code block greese={{ inView: 'blurIn', delay: 0.3 }}>
              {step.code}
            </Code>
          </Stack>
        </Card>
      ))}
    </Grid>
    <Stack
      direction="row"
      gap={3}
      wrap="wrap"
      justify="center"
      greese={{ inView: 'fadeUp' }}
    >
      <Button asChild size="lg" greese={{ hover: 'lift', press: 'squish' }}>
        <a href={DOCS_URL}>Read the docs</a>
      </Button>
      <Button
        asChild
        size="lg"
        variant="outline"
        tone="neutral"
        greese={{ hover: 'lift', press: 'squish' }}
      >
        <RouteLink to="studio">Make a theme</RouteLink>
      </Button>
      <Text tone="muted" className="site-start-note">
        Using only a few components? Import their stylesheets instead, such as{' '}
        <Code>@greese/react/css/Button.css</Code>.
      </Text>
    </Stack>
  </Section>
)
