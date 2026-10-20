import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tab, TabList, TabPanel, Tabs, Text } from '@greese/react'

/** The row of tabs inside Tabs: arrow keys move between them. */
const meta = {
  title: 'Content/TabList',
  component: TabList,
  args: {
    'aria-label': 'Project',
    children: (
      <>
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="settings">Settings</Tab>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <Tabs defaultValue="overview">
        <Story />
        {['overview', 'activity', 'settings'].map((value) => (
          <TabPanel key={value} value={value}>
            <Text>The {value} panel.</Text>
          </TabPanel>
        ))}
      </Tabs>
    ),
  ],
} satisfies Meta<typeof TabList>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
