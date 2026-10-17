import type { Meta, StoryObj } from '@storybook/react-vite'
import { AspectRatio, Box, Center, Container, Hide, Show } from '@sauce-ui/react'
import { Tile } from './shared.tsx'

const meta = { title: 'Layout/Box and friends', component: Box } satisfies Meta<
  typeof Box
>
export default meta

type Story = StoryObj<typeof meta>

/** Typed, responsive style props. Spacing takes tokens (0-8) or any length. */
export const StyleProps: Story = {
  args: {
    p: { xs: 3, md: 6 },
    maxW: '32rem',
    mx: 'auto',
    textAlign: { xs: 'start', md: 'center' },
    style: {
      background: 'var(--sauce-color-surface)',
      borderRadius: 'var(--sauce-radius-lg)',
    },
    children: 'Padding grows at md; text centres at md.',
  },
}

export const ContainerSizes: Story = {
  render: () => (
    <>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Container key={size} size={size} my={2}>
          <Tile>Container size=&quot;{size}&quot;</Tile>
        </Container>
      ))}
    </>
  ),
}

export const Centered: Story = {
  render: () => (
    <Center style={{ minBlockSize: '12rem', background: 'var(--sauce-color-surface)' }}>
      <Tile>Centred on both axes</Tile>
    </Center>
  ),
}

/** CSS-only: no matchMedia, no hydration mismatch. Resize the viewport. */
export const ShowAndHide: Story = {
  render: () => (
    <>
      <Show above="md">
        <Tile>Visible from md up</Tile>
      </Show>
      <Show below="md">
        <Tile>Visible below md</Tile>
      </Show>
      <Hide above="sm" below="lg">
        <Tile>Hidden between sm and lg</Tile>
      </Hide>
    </>
  ),
}

/** Square on phones, 16:9 from md. Space is reserved before the image loads. */
export const MediaFrame: Story = {
  render: () => (
    <Box maxW="32rem">
      <AspectRatio
        ratio={{ xs: 1, md: 16 / 9 }}
        style={{ borderRadius: 'var(--sauce-radius-lg)' }}
      >
        <img
          alt=""
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%2360a5fa'/%3E%3C/svg%3E"
        />
      </AspectRatio>
    </Box>
  ),
}
