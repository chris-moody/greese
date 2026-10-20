import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  AppBar,
  Sidebar,
  SidebarLayout,
  SidebarTrigger,
  Stack,
  Text,
} from '@greese/react'

/** The button that opens a SidebarLayout's sidebar below its breakpoint. */
const meta = {
  title: 'Navigation/SidebarTrigger',
  component: SidebarTrigger,
  parameters: { layout: 'fullscreen' },
  args: { label: 'Open navigation' },
  decorators: [
    (Story) => (
      <SidebarLayout breakpoint="md">
        <Sidebar label="Main navigation">
          <Stack p={3}>
            <Text>Navigation</Text>
          </Stack>
        </Sidebar>
        <div>
          <AppBar>
            <Story />
            <Text weight="semibold">Greese</Text>
          </AppBar>
        </div>
      </SidebarLayout>
    ),
  ],
} satisfies Meta<typeof SidebarTrigger>
export default meta

type Story = StoryObj<typeof meta>

/** In the app bar; resize below md, where it opens the sidebar. */
export const Playground: Story = {}
