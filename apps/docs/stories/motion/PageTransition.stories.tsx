import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type JSX } from 'react'
import {
  Button,
  Card,
  Heading,
  PageTransition,
  Stack,
  Text,
  usePageNavigate,
  type PageEffect,
  type PageTransitionProps,
} from '@greese/react'

const PAGES = ['Overview', 'Pricing', 'Contact'] as const

/**
 * A router of the story's own: the page is state. In an app, hand
 * `usePageNavigate` your router's navigate (React Router's `useNavigate()`).
 */
const Pages = (props: Omit<PageTransitionProps, 'children'>): JSX.Element => {
  const [index, setIndex] = useState(0)
  const page = usePageNavigate((to) => {
    if (typeof to === 'string') setIndex(Number(to.slice(1)))
  })
  // The story stays on one URL, so a navigation here is its own type,
  // `story`, which the PageTransition below plays like a page change, and
  // says it's a page change (`greese-page`), so a live page leaves live.
  const go = (i: number) => page.navigate(`#${i}`, { types: ['greese-page', 'story'] })
  return (
    <Stack gap={4}>
      <Stack direction="row" gap={2}>
        {PAGES.map((name, i) => (
          <Button
            key={name}
            size="sm"
            variant={i === index ? 'solid' : 'soft'}
            aria-current={i === index ? 'page' : undefined}
            onClick={() => go(i)}
          >
            {name}
          </Button>
        ))}
      </Stack>
      <PageTransition
        {...props}
        types={{ story: { enter: props.enter, exit: props.exit as PageEffect } }}
      >
        {props.mode === 'live' ? (
          // Live: each card has a greese entrance, which makes it a member;
          // members leave one after another (the last first), then the next
          // page's play their entrances.
          <Stack gap={3}>
            {[1, 2, 3].map((n) => (
              <Card key={`${index}-${n}`} p={4} greese="fadeUp">
                <Text>
                  {PAGES[index]}, part {n}
                </Text>
              </Card>
            ))}
          </Stack>
        ) : (
          <Card p={5}>
            <Heading level={2} variant="h3">
              {PAGES[index]}
            </Heading>
            <Text tone="muted">
              Page {index + 1} of {PAGES.length}. Pick another to see this one leave and
              the next arrive.
            </Text>
          </Card>
        )}
      </PageTransition>
    </Stack>
  )
}

const meta = {
  title: 'Motion/PageTransition',
  component: PageTransition,
  args: { enter: 'theme', exit: 'theme' },
  argTypes: {
    enter: {
      control: 'select',
      options: ['theme', 'none', 'fadeUp', 'popIn', 'slideLeft', 'wipeRight', 'pocketUp'],
    },
    exit: {
      control: 'select',
      options: [
        'theme',
        'none',
        'fadeOut',
        'scaleOut',
        'fadeOutUp',
        'wipeOutLeft',
        'pocketOutDown',
      ],
    },
  },
  parameters: { layout: 'padded' },
  render: (args) => <Pages {...args} />,
} satisfies Meta<typeof PageTransition>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Pick a page: the old one leaves and the new one arrives, as the motion
 * theme says unless you name effects. Where the browser has no view
 * transitions, and under reduced motion, the page simply changes.
 */
export const Playground: Story = {}

/** The old page scales out and the new one pops in. */
export const NamedEffects: Story = {
  args: { enter: 'popIn', exit: 'scaleOut' },
}

/** Pockets: the old page sinks into a slot and the new one rises out of it. */
export const Pockets: Story = {
  args: { enter: 'pocketUp', exit: 'pocketOutDown' },
}

/**
 * Live: the page's cards leave on the real page, the last first, while the
 * next page loads; then the next page's cards play their entrances.
 */
export const Live: Story = {
  args: { mode: 'live', stagger: 0.08 },
}
