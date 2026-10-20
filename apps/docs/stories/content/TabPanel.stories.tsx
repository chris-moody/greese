import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tab, TabList, TabPanel, Tabs, Text } from '@greese-ui/react'

/** The content for one tab, shown while that tab is selected. */
const meta = {
  title: 'Content/TabPanel',
  component: TabPanel,
  args: {
    value: 'overview',
    children: <Text>The overview panel: whatever belongs to the selected tab.</Text>,
  },
  decorators: [
    (Story) => (
      <Tabs defaultValue="overview">
        <TabList aria-label="Project">
          <Tab value="overview">Overview</Tab>
          <Tab value="activity">Activity</Tab>
        </TabList>
        <Story />
        <TabPanel value="activity">
          <Text>The activity panel.</Text>
        </TabPanel>
      </Tabs>
    ),
  ],
} satisfies Meta<typeof TabPanel>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
