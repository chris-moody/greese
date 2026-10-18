import type { Meta, StoryObj } from '@storybook/react-vite'
import { Code, Heading, Link, Stack, Text } from '@sauce-ui/react'

const meta = { title: 'Content/Typography' } satisfies Meta
export default meta

type Story = StoryObj

/** Headings shrink on phones by default; `size` overrides the look, not the level. */
export const Headings: Story = {
  render: () => (
    <Stack gap={3}>
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Heading key={level} level={level}>
          Heading level {level}
        </Heading>
      ))}
      <Heading level={2} size="md" tone="muted">
        A level-2 heading styled small
      </Heading>
    </Stack>
  ),
}

export const BodyText: Story = {
  render: () => (
    <Stack gap={3} maxW="36rem">
      <Text size={{ xs: 'md', md: 'lg' }}>
        Responsive body text: md on phones, lg from md. Read the{' '}
        <Link href="#docs">docs</Link> or run <Code>npm install @sauce-ui/react</Code>.
      </Text>
      <Text tone="muted" size="sm">
        Muted, small supporting text.
      </Text>
      <Text truncate={2}>
        Clamped to two lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
        do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
        consequat.
      </Text>
      <Stack direction="row" gap={3} wrap="wrap">
        {(['accent', 'positive', 'negative', 'warning', 'info'] as const).map((tone) => (
          <Text key={tone} tone={tone} weight="semibold">
            {tone}
          </Text>
        ))}
      </Stack>
      <Code
        block
      >{`import { Stack } from '@sauce-ui/react'\n\n<Stack gap={4}>…</Stack>`}</Code>
    </Stack>
  ),
}
