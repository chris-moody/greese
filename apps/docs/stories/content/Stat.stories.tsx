import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stat } from '@greese/react'
import { StarIcon } from '@greese/icons'

const meta = {
  title: 'Content/Stat',
  component: Stat,
  args: {
    label: 'Revenue',
    value: '$48,200',
    description: 'up 12% on last month',
    tone: 'positive',
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['muted', 'positive', 'negative'] },
  },
} satisfies Meta<typeof Stat>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithMedia: Story = {
  args: {
    label: 'Rating',
    value: '4.8',
    description: 'from 1,204 reviews',
    tone: 'muted',
    media: <StarIcon size="2.5rem" />,
  },
}
