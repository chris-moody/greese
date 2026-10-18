import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  AppBar,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Pagination,
  Sidebar,
  SidebarLayout,
  SidebarTrigger,
  Spacer,
  Stack,
  Text,
} from '@sauce-ui/react'

const meta = {
  title: 'Overlays/Navigation',
  parameters: { layout: 'fullscreen' },
} satisfies Meta
export default meta

type Story = StoryObj

/** Sidebar is persistent from md and off-canvas below it. Resize to see both. */
export const AppShell: Story = {
  render: () => (
    <SidebarLayout breakpoint="md">
      <Sidebar label="Main navigation">
        <Stack gap={1} p={2}>
          {['Overview', 'Projects', 'Members', 'Settings'].map((item) => (
            <Button
              key={item}
              asChild
              variant="ghost"
              tone="neutral"
              style={{ justifyContent: 'flex-start' }}
            >
              <a href={`#${item.toLowerCase()}`}>{item}</a>
            </Button>
          ))}
        </Stack>
      </Sidebar>
      <div>
        <AppBar>
          <SidebarTrigger />
          <Text weight="semibold">Sauce</Text>
          <Spacer />
          <Button size="sm" variant="outline" tone="neutral">
            Sign out
          </Button>
        </AppBar>
        <Stack gap={5} p={5}>
          <Breadcrumbs maxItems={3}>
            <BreadcrumbItem href="#">Home</BreadcrumbItem>
            <BreadcrumbItem href="#">Projects</BreadcrumbItem>
            <BreadcrumbItem href="#">Sauce UI</BreadcrumbItem>
            <BreadcrumbItem>Settings</BreadcrumbItem>
          </Breadcrumbs>
          <Text tone="muted">Scroll: the app bar sticks and gains a shadow.</Text>
          <div style={{ blockSize: '120vh' }} />
          <Pagination count={20} defaultPage={8} />
        </Stack>
      </div>
    </SidebarLayout>
  ),
}
