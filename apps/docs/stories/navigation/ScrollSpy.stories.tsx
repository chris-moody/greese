import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link, ScrollSpy, Stack, Text } from '@greese/react'

const sections = [
  ['spy-install', 'Install'],
  ['spy-usage', 'Usage'],
  ['spy-theming', 'Theming'],
] as const

const meta = {
  title: 'Navigation/ScrollSpy',
  component: ScrollSpy,
  args: {
    asChild: true,
    offset: 80,
    children: (
      <nav aria-label="On this page">
        <Stack direction="row" gap={4}>
          {sections.map(([id, label]) => (
            <Link key={id} href={`#${id}`} tone="neutral">
              {label}
            </Link>
          ))}
        </Stack>
      </nav>
    ),
  },
  decorators: [
    (Story) => (
      <Stack gap={4}>
        <Story />
        {sections.map(([id, label]) => (
          <section key={id} id={id} style={{ minBlockSize: '60vh' }}>
            <Text variant="s2" weight="semibold">
              {label}
            </Text>
            <Text tone="muted">Scroll the page: the link to this section lights up.</Text>
          </section>
        ))}
      </Stack>
    ),
  ],
} satisfies Meta<typeof ScrollSpy>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Same-page `#id` links inside get `aria-current="location"` while their
 * section is current: the last one whose top is above `offset`.
 */
export const Playground: Story = {}
