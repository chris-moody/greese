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
} from '@greese/react'
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
        <Heading level={3} variant="h5">
          Card title
        </Heading>
        <Text tone="muted" variant="p3">
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
    <Grid container minChildWidth="14rem" gap={4}>
      {(['outline', 'elevated', 'filled'] as const).map((variant, i) => (
        <Card key={variant} variant={variant} interactive={i === 1}>
          <Stack direction="row" gap={2} align="center">
            <Heading level={3} variant="h6">
              {variant}
            </Heading>
            {i === 1 && <Badge tone="primary">Interactive</Badge>}
          </Stack>
          <Text tone="muted" variant="p3">
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
        <Heading level={3} variant="h6">
          Open project
        </Heading>
        <Text tone="muted" variant="p3">
          The whole card is the link.
        </Text>
      </a>
    </Card>
  ),
}
