import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link, ScrollSpy, Stack, Text } from '@greese/react'

const sections = [
  ['spy-install', 'Install'],
  ['spy-usage', 'Usage'],
  ['spy-theming', 'Theming'],
] as const

const PANEL = {
  blockSize: '24rem',
  overflowY: 'auto',
  // Links scroll their section to just under the sticky links.
  scrollPaddingBlockStart: '3.5rem',
  border: '1px solid var(--greese-color-border)',
  borderRadius: 'var(--greese-corner-surface)',
} as const

const STICKY_NAV = {
  position: 'sticky',
  insetBlockStart: 0,
  zIndex: 1,
  padding: 'var(--greese-space-3) var(--greese-space-4)',
  backgroundColor: 'var(--greese-color-surface-overlay)',
  borderBlockEnd: '1px solid var(--greese-color-border)',
} as const

const meta = {
  title: 'Navigation/ScrollSpy',
  component: ScrollSpy,
  args: {
    asChild: true,
    offset: 80,
    children: (
      <nav aria-label="On this page" style={STICKY_NAV}>
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
  // A panel that scrolls on its own, so the links stay in view while the
  // sections go by, wherever the story is shown.
  decorators: [
    (Story) => (
      <div style={PANEL}>
        <Story />
        <Stack gap={4} p={4}>
          {sections.map(([id, label]) => (
            <section key={id} id={id} style={{ minBlockSize: '18rem' }}>
              <Text variant="s2" weight="semibold">
                {label}
              </Text>
              <Text tone="muted">
                Scroll the panel: the link to this section lights up.
              </Text>
            </section>
          ))}
        </Stack>
      </div>
    ),
  ],
} satisfies Meta<typeof ScrollSpy>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Same-page `#id` links inside get `aria-current="location"` while their
 * section is current: the last one whose top is above `offset`, measured from
 * the top of the page, or of the panel the sections scroll in, as here.
 */
export const Playground: Story = {}
