import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pagination } from '@sauce-ui/react'

const meta = {
  title: 'Navigation/Pagination',
  component: Pagination,
  args: { count: 20, defaultPage: 8 },
} satisfies Meta<typeof Pagination>
export default meta

type Story = StoryObj<typeof meta>

/** Condenses to previous / current / next on phones. */
export const Playground: Story = {}

/** `getHref` renders real, crawlable links that work without JavaScript. */
export const Links: Story = { args: { getHref: (page) => `#page-${page}` } }

export const FewPages: Story = { args: { count: 5, defaultPage: 1 } }
