import type { Meta, StoryObj } from '@storybook/react-vite'
import { Footer, FooterSection, Link } from '@greese/react'

const meta = {
  title: 'Navigation/FooterSection',
  component: FooterSection,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Footer>
        <Story />
      </Footer>
    ),
  ],
  args: {
    title: 'Docs',
    children: [
      <Link key="start" href="#start" tone="neutral">
        Getting started
      </Link>,
      <Link key="theming" href="#theming" tone="neutral">
        Theming
      </Link>,
      <Link key="motion" href="#motion" tone="neutral">
        Motion
      </Link>,
    ],
  },
} satisfies Meta<typeof FooterSection>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
