import type { Meta, StoryObj } from '@storybook/react-vite'
import { HeartIcon, SearchIcon, StarIcon, SunIcon } from '@greese/icons'
import { Stack, Text } from '@greese/react'

/** Shown on Foundations/Icons (Icons.mdx), which embeds these stories. */
const meta = {
  title: 'Foundations/Icons',
  component: StarIcon,
  tags: ['!autodocs'],
  args: { size: 48, strokeWidth: 1.75 },
  argTypes: {
    // Icons come from a factory (createIcon), which docgen can't read, so
    // their props are described here.
    size: {
      control: { type: 'range', min: 12, max: 96, step: 4 },
      description:
        'Width and height: a number of pixels or any CSS length. `1em` by default, so it follows the text.',
      table: { type: { summary: 'number | string' }, defaultValue: { summary: "'1em'" } },
    },
    strokeWidth: {
      control: { type: 'range', min: 0.5, max: 3, step: 0.25 },
      description: 'Line width, in units of the 16 × 16 drawing.',
      table: { type: { summary: 'number | string' }, defaultValue: { summary: '1.75' } },
    },
    title: {
      control: 'text',
      description:
        'An accessible name. Without one the icon is decorative (`aria-hidden`); name the button or link around it instead.',
      table: { type: { summary: 'string' } },
    },
    fill: {
      control: 'color',
      description:
        'Fills the shapes. `none` by default; any color, `currentColor`, or `url(#gradient)`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'none'" } },
    },
    stroke: {
      control: 'color',
      description:
        'The line color. `currentColor` by default, so it follows the text; any color or `url(#gradient)`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'currentColor'" } },
    },
  },
} satisfies Meta<typeof StarIcon>
export default meta

type Story = StoryObj<typeof meta>

/** Try the controls: size, stroke width, fill and stroke colors. */
export const Playground: Story = {}

/** `size` sets width and height: a number of pixels or any CSS length. The default, `1em`, follows the text. */
export const Size: Story = {
  render: () => (
    <Stack direction="row" gap={4} align="end">
      <SearchIcon />
      <SearchIcon size={24} />
      <SearchIcon size="2.5rem" />
      <Text variant="h2">
        <SearchIcon /> 1em of 3xl text
      </Text>
    </Stack>
  ),
}

/** Icons draw in `currentColor`, so they take the color of the text around them. */
export const Color: Story = {
  render: () => (
    <Stack direction="row" gap={4}>
      <Text tone="primary">
        <SunIcon size={32} />
      </Text>
      <span style={{ color: 'var(--greese-color-positive)' }}>
        <SunIcon size={32} />
      </span>
      <SunIcon size={32} color="#e11d48" />
    </Stack>
  ),
}

/** `stroke` recolors the lines; `strokeWidth` thickens or thins them. */
export const Stroke: Story = {
  render: () => (
    <Stack direction="row" gap={4}>
      <StarIcon size={40} strokeWidth={1} />
      <StarIcon size={40} strokeWidth={2.5} />
      <StarIcon size={40} stroke="var(--greese-color-warning)" strokeWidth={2} />
    </Stack>
  ),
}

/** `fill` fills the shapes; with `strokeWidth={0}` the icon becomes solid. */
export const Fill: Story = {
  render: () => (
    <Stack direction="row" gap={4}>
      <HeartIcon size={40} fill="var(--greese-color-negative)" />
      <HeartIcon size={40} fill="currentColor" strokeWidth={0} />
      <HeartIcon
        size={40}
        fill="color-mix(in oklab, var(--greese-color-primary) 25%, transparent)"
        stroke="var(--greese-color-primary)"
      />
    </Stack>
  ),
}

/**
 * Gradients: define a `<linearGradient>` once, anywhere on the page, and point
 * `fill` or `stroke` at it with `url(#id)`.
 */
export const Gradient: Story = {
  render: () => (
    <Stack direction="row" gap={4}>
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="icon-sunset" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
        </defs>
      </svg>
      <HeartIcon size={48} fill="url(#icon-sunset)" strokeWidth={0} />
      <StarIcon size={48} stroke="url(#icon-sunset)" strokeWidth={2} />
    </Stack>
  ),
}
