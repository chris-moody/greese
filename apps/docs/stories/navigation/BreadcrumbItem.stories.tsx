import type { Meta, StoryObj } from '@storybook/react-vite'
import { BreadcrumbItem, Breadcrumbs } from '@greese-ui/react'

/** One link in a Breadcrumbs trail; without `href`, the current page. */
const meta = {
  title: 'Navigation/BreadcrumbItem',
  component: BreadcrumbItem,
  args: { href: '#', children: 'Projects' },
  decorators: [
    (Story) => (
      <Breadcrumbs>
        <BreadcrumbItem href="#">Home</BreadcrumbItem>
        <Story />
        <BreadcrumbItem>Settings</BreadcrumbItem>
      </Breadcrumbs>
    ),
  ],
} satisfies Meta<typeof BreadcrumbItem>
export default meta

type Story = StoryObj<typeof meta>

/** The middle item. */
export const Playground: Story = {}
