import type { Meta, StoryObj } from '@storybook/react-vite'
import { Center } from '@greese-ui/react'
import { StarIcon, Tile } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Layout/Center',
  component: Center,
  args: {
    style: { minBlockSize: '12rem', background: 'var(--greese-color-surface)' },
    children: <Tile>Centred on both axes</Tile>,
  },
} satisfies Meta<typeof Center>
export default meta

type Story = StoryObj<typeof meta>

export const Block: Story = {}

/** `inline` shrinks to its content: handy for icon badges. */
export const Inline: Story = {
  args: {
    inline: true,
    style: {
      inlineSize: '2.5rem',
      blockSize: '2.5rem',
      borderRadius: '50%',
      background: 'var(--greese-color-accent)',
      color: 'var(--greese-color-on-accent)',
    },
    children: <StarIcon />,
  },
}
