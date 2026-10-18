import type { Meta, StoryObj } from '@storybook/react-vite'
import { Container } from '@sauce-ui/react'
import { Tile } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Layout/Container',
  component: Container,
  args: {
    size: 'md',
    children: <Tile>Centred at a readable width, gutters grow at md</Tile>,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', 'full'] },
  },
} satisfies Meta<typeof Container>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Sizes: Story = {
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
