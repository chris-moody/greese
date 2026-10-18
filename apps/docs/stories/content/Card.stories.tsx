import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Badge,
  Card,
  CardMedia,
  Grid,
  Heading,
  Image,
  Stack,
  Text,
} from '@sauce-ui/react'
import { art } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Content/Card',
  component: Card,
  subcomponents: { CardMedia },
  args: { variant: 'outline' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['outline', 'elevated', 'filled'] },
  },
  render: (args) => (
    <Card {...args} style={{ maxInlineSize: '20rem' }}>
      <CardMedia>
        <Image alt="" src={art(200)} ratio={16 / 9} placeholder="#ccd" />
      </CardMedia>
      <Stack gap={2}>
        <Heading level={3} size="lg">
          Card title
        </Heading>
        <Text tone="muted" size="sm">
          CardMedia bleeds through the padding, which steps up at md.
        </Text>
      </Stack>
    </Card>
  ),
} satisfies Meta<typeof Card>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <Grid minChildWidth="14rem" gap={4}>
      {(['outline', 'elevated', 'filled'] as const).map((variant, i) => (
        <Card key={variant} variant={variant} interactive={i === 1}>
          <Stack direction="row" gap={2} align="center">
            <Heading level={3} size="md">
              {variant}
            </Heading>
            {i === 1 && <Badge tone="accent">Interactive</Badge>}
          </Stack>
          <Text tone="muted" size="sm">
            A surface for related content.
          </Text>
        </Card>
      ))}
    </Grid>
  ),
}

/** A whole-card link: put the anchor on the card with `asChild`. */
export const AsLink: Story = {
  render: () => (
    <Card asChild interactive style={{ maxInlineSize: '20rem' }}>
      <a href="#project">
        <Heading level={3} size="md">
          Open project
        </Heading>
        <Text tone="muted" size="sm">
          The whole card is the link.
        </Text>
      </a>
    </Card>
  ),
}
