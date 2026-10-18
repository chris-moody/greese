import type { Meta, StoryObj } from '@storybook/react-vite'
import { BreadcrumbItem, Breadcrumbs } from '@sauce-ui/react'

const meta = {
  title: 'Navigation/Breadcrumbs',
  component: Breadcrumbs,
  subcomponents: { BreadcrumbItem },
  args: {
    children: [
      <BreadcrumbItem key="home" href="#">
        Home
      </BreadcrumbItem>,
      <BreadcrumbItem key="projects" href="#">
        Projects
      </BreadcrumbItem>,
      <BreadcrumbItem key="sauce" href="#">
        Sauce UI
      </BreadcrumbItem>,
      <BreadcrumbItem key="settings">Settings</BreadcrumbItem>,
    ],
  },
} satisfies Meta<typeof Breadcrumbs>
export default meta

type Story = StoryObj<typeof meta>

/** The last item is the current page (`aria-current="page"`). */
export const Playground: Story = {}

/** `maxItems` collapses the middle behind an expand button. */
export const Collapsed: Story = { args: { maxItems: 3 } }
