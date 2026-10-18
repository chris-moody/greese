import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Avatar,
  AvatarGroup,
  Badge,
  Card,
  CardMedia,
  Grid,
  Heading,
  Image,
  Stack,
  Text,
} from '@sauce-ui/react'

const meta = { title: 'Content/Cards and media' } satisfies Meta
export default meta

type Story = StoryObj

const art = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="hsl(${hue} 70% 60%)"/><circle cx="12" cy="3" r="2" fill="hsl(${hue} 80% 85%)"/></svg>`
  )}`

export const Cards: Story = {
  render: () => (
    <Grid minChildWidth="16rem" gap={4}>
      {(['outline', 'elevated', 'filled'] as const).map((variant, i) => (
        <Card key={variant} variant={variant} interactive={i === 1}>
          <CardMedia>
            <Image alt="" src={art(200 + i * 40)} ratio={16 / 9} placeholder="#ccd" />
          </CardMedia>
          <Stack gap={2}>
            <Stack direction="row" gap={2} align="center">
              <Heading level={3} size="lg">
                {variant} card
              </Heading>
              {i === 1 && <Badge tone="accent">Interactive</Badge>}
            </Stack>
            <Text tone="muted" size="sm">
              CardMedia bleeds through the card padding, which steps up at md.
            </Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  ),
}

export const Avatars: Story = {
  render: () => (
    <Stack gap={4}>
      <Stack direction="row" gap={3} align="center">
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <Avatar key={size} name="Ada Lovelace" size={size} />
        ))}
        <Avatar name="Broken Image" src="/does-not-exist.png" size="lg" />
        <Avatar name="Square" shape="square" size="lg" />
      </Stack>
      <AvatarGroup aria-label="Shared with" max={3}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Alan Turing" />
        <Avatar name="Katherine Johnson" />
        <Avatar name="Edsger Dijkstra" />
      </AvatarGroup>
    </Stack>
  ),
}
