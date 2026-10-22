import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, IconButton, Stack } from '@greese/react'
import { ArrowRightIcon, PlusIcon, TrashIcon } from '@greese/icons'

const meta = {
  title: 'Forms/Button',
  component: Button,
  args: { children: 'Save changes' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['solid', 'soft', 'outline', 'ghost', 'text'],
    },
    tone: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary', 'accent', 'neutral', 'negative'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const VariantsAndTones: Story = {
  render: () => (
    <Stack gap={3}>
      {(
        ['primary', 'secondary', 'tertiary', 'accent', 'neutral', 'negative'] as const
      ).map((tone) => (
        <Stack key={tone} direction="row" gap={2} wrap="wrap">
          {(['solid', 'soft', 'outline', 'ghost', 'text'] as const).map((variant) => (
            <Button key={variant} tone={tone} variant={variant}>
              {variant} {tone}
            </Button>
          ))}
        </Stack>
      ))}
    </Stack>
  ),
}

export const IconsSizesAndStates: Story = {
  render: () => (
    <Stack gap={3}>
      <Stack direction="row" gap={2} align="center" wrap="wrap">
        <Button size="sm" startIcon={<PlusIcon />}>
          Small
        </Button>
        <Button startIcon={<PlusIcon />}>Medium</Button>
        <Button size="lg" endIcon={<ArrowRightIcon />}>
          Large
        </Button>
        <IconButton label="Delete" tone="negative">
          <TrashIcon />
        </IconButton>
      </Stack>
      <Stack direction="row" gap={2} wrap="wrap">
        <Button loading>Saving</Button>
        <Button disabled>Disabled</Button>
        <Button asChild variant="outline" endIcon={<ArrowRightIcon />}>
          <a href="#docs">A link styled as a button</a>
        </Button>
      </Stack>
    </Stack>
  ),
}

/** Full width on phones, natural width from md. */
export const ResponsiveFullWidth: Story = {
  args: { fullWidth: { xs: true, md: false } },
}
