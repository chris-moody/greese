import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  AppBar,
  Button,
  Sidebar,
  SidebarLayout,
  SidebarTrigger,
  Spacer,
  Stack,
  Text,
} from '@greese/react'

const meta = {
  title: 'Navigation/SidebarLayout',
  component: SidebarLayout,
  subcomponents: { Sidebar, SidebarTrigger },
  parameters: { layout: 'fullscreen' },
  args: { breakpoint: 'md' },
  argTypes: {
    breakpoint: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
  },
  render: (args) => (
    <SidebarLayout {...args}>
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
          <Text weight="semibold">Greese</Text>
          <Spacer />
        </AppBar>
        <Stack gap={5} p={5}>
          <Text tone="muted">
            A persistent column from the breakpoint up, off-canvas below it. Resize to see
            both.
          </Text>
        </Stack>
      </div>
    </SidebarLayout>
  ),
} satisfies Meta<typeof SidebarLayout>
export default meta

type Story = StoryObj<typeof meta>

export const AppShell: Story = {}
