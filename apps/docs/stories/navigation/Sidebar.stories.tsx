import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  AppBar,
  Button,
  Sidebar,
  SidebarLayout,
  SidebarTrigger,
  Stack,
  Text,
} from '@greese-ui/react'

/** The navigation column of a SidebarLayout: persistent from its breakpoint, off-canvas below. */
const meta = {
  title: 'Navigation/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Main navigation',
    children: (
      <Stack gap={1} p={2}>
        {['Overview', 'Projects', 'Settings'].map((item) => (
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
    ),
  },
  decorators: [
    (Story) => (
      <SidebarLayout breakpoint="md">
        <Story />
        <div>
          <AppBar>
            <SidebarTrigger />
            <Text weight="semibold">Greese</Text>
          </AppBar>
          <Stack p={5}>
            <Text tone="muted">Resize below md to move the sidebar off-canvas.</Text>
          </Stack>
        </div>
      </SidebarLayout>
    ),
  ],
} satisfies Meta<typeof Sidebar>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Icons only, from the breakpoint up. */
export const Collapsed: Story = { args: { collapsed: true } }
