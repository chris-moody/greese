/**
 * SaaS landing page: hero with a product preview, customer logos, a feature
 * grid, pricing with a monthly and yearly switch, testimonials, an FAQ
 * accordion and a closing call to action.
 */
import { useState, type JSX } from 'react'
import {
  Accordion,
  AccordionItem,
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Heading,
  List,
  ListItem,
  Progress,
  Rating,
  Segment,
  SegmentedControl,
  Stack,
  Stat,
  Text,
} from '@greese/react'
import {
  AccessibilityIcon,
  ArrowRightIcon,
  CheckIcon,
  FeatherIcon,
  LayersIcon,
  MotionIcon,
  PhoneIcon,
  ServerIcon,
} from '@greese/icons'

const features = [
  {
    icon: <FeatherIcon />,
    title: 'Light by default',
    text: 'Pages ship a few kilobytes of CSS and almost no JavaScript.',
  },
  {
    icon: <PhoneIcon />,
    title: 'Phone first',
    text: 'Every screen starts at 320px and grows, with 44px touch targets.',
  },
  {
    icon: <AccessibilityIcon />,
    title: 'Accessible',
    text: 'Native elements, real focus order, and tested with screen readers.',
  },
  {
    icon: <MotionIcon />,
    title: 'Motion built in',
    text: 'Entrances and interactions on any component, reduced-motion aware.',
  },
  {
    icon: <LayersIcon />,
    title: 'Themeable',
    text: 'Tokens, component styles and motion, edited live in the Studio.',
  },
  {
    icon: <ServerIcon />,
    title: 'Server friendly',
    text: 'Layout and text components render on the server untouched.',
  },
]

const plans = [
  {
    name: 'Starter',
    monthly: 0,
    blurb: 'For side projects and trying things out.',
    features: ['3 projects', 'Community support', 'All components'],
  },
  {
    name: 'Team',
    monthly: 24,
    blurb: 'For product teams shipping every week.',
    features: [
      'Unlimited projects',
      'Theme Studio sync',
      'Priority support',
      'Design reviews',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    monthly: 79,
    blurb: 'For organizations with many brands.',
    features: ['Everything in Team', 'SSO and audit log', 'Custom themes', 'Uptime SLA'],
  },
]

const quotes = [
  {
    name: 'Maya Chen',
    role: 'Design lead, Fieldstone',
    text: 'We replaced two libraries and a pile of overrides. Our pages got faster and our designers got their brand back.',
  },
  {
    name: 'Jonas Weber',
    role: 'CTO, Arc Credit',
    text: 'The Studio means our themes are a file in the repo, reviewed like code. That alone was worth it.',
  },
  {
    name: 'Aiyana Brooks',
    role: 'Engineer, Harbor',
    text: 'Native dialogs and popovers. No portals, no z-index wars, and focus just works.',
  },
]

const faqs = [
  ['Is there a free plan?', 'Yes. Starter is free forever for up to three projects.'],
  [
    'Can I change plans later?',
    'Any time. Changes apply from your next billing date, prorated.',
  ],
  [
    'Do you offer discounts for nonprofits?',
    'Nonprofits and schools get Team at half price. Write to us.',
  ],
  [
    'Where is my data stored?',
    'In the EU or the US, your choice, encrypted at rest and in transit.',
  ],
] as const

export const Saas = (): JSX.Element => {
  const [billing, setBilling] = useState('yearly')
  const price = (monthly: number) =>
    billing === 'yearly' ? Math.round(monthly * 0.8) : monthly

  return (
    <Stack gap={0}>
      <section className="tpl-hero">
        <Container size="lg">
          <Grid
            container
            columns={{ xs: 1, md: 2 }}
            gap={6}
            align="center"
            py={{ xs: 6, md: 8 }}
          >
            <Stack gap={4} greese={{ enter: 'theme', stagger: 0.06 }}>
              <span>
                <Badge tone="primary" variant="soft">
                  New: shape themes
                </Badge>
              </span>
              <Heading level={1} variant="h1">
                Ship interfaces your users feel are fast.
              </Heading>
              <Text variant="p1" tone="muted">
                Launchpad gives product teams one design system for every screen:
                themeable, accessible, and small enough to forget about.
              </Text>
              <Stack direction="row" gap={2} wrap="wrap">
                <Button size="lg" endIcon={<ArrowRightIcon />}>
                  Start free trial
                </Button>
                <Button size="lg" variant="soft" tone="neutral">
                  Book a demo
                </Button>
              </Stack>
              <Text variant="caption" tone="muted">
                No card needed · 14 days of Team, then Starter for free
              </Text>
            </Stack>
            <Card
              variant="elevated"
              aria-label="Product preview"
              greese={{ enter: 'theme', delay: 0.2 }}
            >
              <Stack direction="row" justify="between" align="center">
                <Text weight="semibold">Release health</Text>
                <Badge tone="positive">Live</Badge>
              </Stack>
              <Grid container columns={2} gap={3}>
                <Stat
                  label="Page weight"
                  value="38 kB"
                  description="down 61%"
                  tone="positive"
                />
                <Stat label="LCP" value="0.9 s" description="p75, mobile" tone="muted" />
              </Grid>
              <Stack gap={2}>
                <Text variant="p3">Accessibility checks</Text>
                <Progress value={96} aria-label="Accessibility checks: 96% passing" />
                <Text variant="p3">Design tokens adopted</Text>
                <Progress value={82} aria-label="Design tokens adopted: 82%" />
              </Stack>
            </Card>
          </Grid>
        </Container>
      </section>

      <Container size="lg">
        <Stack gap={8} py={{ xs: 6, md: 8 }}>
          <Stack gap={3} align="center">
            <Text variant="caption" tone="muted">
              Trusted by teams at
            </Text>
            <Stack direction="row" gap={{ xs: 4, md: 7 }} wrap="wrap" justify="center">
              {['Northwind', 'Fieldstone', 'Harbor', 'Arc Credit', 'Lumen'].map(
                (logo) => (
                  <Text
                    key={logo}
                    variant="s2"
                    weight="bold"
                    tone="muted"
                    className="tpl-logo"
                  >
                    {logo}
                  </Text>
                )
              )}
            </Stack>
          </Stack>

          <Stack gap={5} id="features">
            <Stack gap={2} align="center" textAlign="center" greese={{ inView: 'theme' }}>
              <Heading level={2} variant="h2">
                Everything a product team needs
              </Heading>
              <Text tone="muted" className="tpl-measure">
                Components, themes and motion that work together, so the next screen takes
                an afternoon.
              </Text>
            </Stack>
            <Grid
              container
              minChildWidth="16rem"
              gap={4}
              greese={{ inView: 'theme', stagger: 0.06 }}
            >
              {features.map((f) => (
                <Card key={f.title} variant="outline">
                  <span className="tpl-feature-icon" aria-hidden="true">
                    {f.icon}
                  </span>
                  <Heading level={3} variant="h6">
                    {f.title}
                  </Heading>
                  <Text variant="p3" tone="muted">
                    {f.text}
                  </Text>
                </Card>
              ))}
            </Grid>
          </Stack>

          <Stack gap={5} id="pricing">
            <Stack gap={3} align="center" textAlign="center" greese={{ inView: 'theme' }}>
              <Heading level={2} variant="h2">
                Simple pricing
              </Heading>
              <SegmentedControl
                label="Billing"
                hideLabel
                value={billing}
                onValueChange={setBilling}
              >
                <Segment value="monthly">Monthly</Segment>
                <Segment value="yearly">Yearly · save 20%</Segment>
              </SegmentedControl>
            </Stack>
            <Grid
              container
              columns={{ xs: 1, md: 3 }}
              gap={4}
              align="stretch"
              greese={{ inView: 'theme', stagger: 0.06 }}
            >
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  variant={plan.popular ? 'elevated' : 'outline'}
                  className="tpl-plan"
                >
                  <Stack direction="row" justify="between" align="center">
                    <Heading level={3} variant="h5">
                      {plan.name}
                    </Heading>
                    {plan.popular && (
                      <Badge tone="primary" variant="solid">
                        Most popular
                      </Badge>
                    )}
                  </Stack>
                  <Text variant="p3" tone="muted">
                    {plan.blurb}
                  </Text>
                  <Stack direction="row" gap={1} align="end">
                    <Text variant="h2" weight="bold">
                      ${price(plan.monthly)}
                    </Text>
                    <Text tone="muted">/ user / month</Text>
                  </Stack>
                  <List>
                    {plan.features.map((feature) => (
                      <ListItem key={feature} start={<CheckIcon />} title={feature} />
                    ))}
                  </List>
                  <Button
                    variant={plan.popular ? 'solid' : 'soft'}
                    tone={plan.popular ? 'primary' : 'neutral'}
                    fullWidth
                  >
                    {plan.monthly ? `Choose ${plan.name}` : 'Start for free'}
                  </Button>
                </Card>
              ))}
            </Grid>
          </Stack>

          <Grid
            container
            minChildWidth="18rem"
            gap={4}
            greese={{ inView: 'theme', stagger: 0.06 }}
          >
            {quotes.map((q) => (
              <Card key={q.name} variant="filled">
                <Rating
                  label={`${q.name}'s rating`}
                  hideLabel
                  value={5}
                  readOnly
                  size="sm"
                />
                <Text>“{q.text}”</Text>
                <Stack direction="row" gap={3} align="center">
                  <Avatar name={q.name} size="sm" />
                  <Stack gap={0}>
                    <Text variant="p3" weight="semibold">
                      {q.name}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {q.role}
                    </Text>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Grid>

          <Grid
            container
            columns={{ xs: 1, md: '1fr 2fr' }}
            gap={6}
            greese={{ inView: 'theme' }}
          >
            <Heading level={2} variant="h3">
              Questions, answered
            </Heading>
            <Accordion>
              {faqs.map(([question, answer]) => (
                <AccordionItem key={question} title={question}>
                  {answer}
                </AccordionItem>
              ))}
            </Accordion>
          </Grid>

          <Card variant="filled" className="tpl-cta" greese={{ inView: 'theme' }}>
            <Stack gap={3} align="center" textAlign="center" py={4}>
              <Heading level={2} variant="h3">
                Your next screen, this afternoon.
              </Heading>
              <Button size="lg" endIcon={<ArrowRightIcon />}>
                Start free trial
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Stack>
  )
}
