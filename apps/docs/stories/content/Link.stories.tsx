import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link, Text } from '@sauce-ui/react'

const meta = {
  title: 'Content/Link',
  component: Link,
  args: { href: '#docs', children: 'Read the docs' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['accent', 'neutral'] },
    underline: { control: 'inline-radio', options: ['always', 'hover'] },
  },
} satisfies Meta<typeof Link>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const InText: Story = {
  render: () => (
    <Text>
      Inline links are underlined by default: <Link href="#a">accent</Link>,{' '}
      <Link href="#b" tone="neutral">
        neutral
      </Link>{' '}
      and{' '}
      <Link href="#c" underline="hover">
        underline on hover
      </Link>
      .
    </Text>
  ),
}
