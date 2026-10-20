import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tab, TabList, TabPanel, Tabs, Text } from '@greese/react'

/** One tab. Its `value` pairs it with the TabPanel of the same value. */
const meta = {
  title: 'Content/Tab',
  component: Tab,
  args: { value: 'activity', children: 'Activity' },
  decorators: [
    (Story) => (
      <Tabs defaultValue="activity">
        <TabList aria-label="Project">
          <Tab value="overview">Overview</Tab>
          <Story />
          <Tab value="settings">Settings</Tab>
        </TabList>
        {['overview', 'activity', 'settings'].map((value) => (
          <TabPanel key={value} value={value}>
            <Text>The {value} panel.</Text>
          </TabPanel>
        ))}
      </Tabs>
    ),
  ],
} satisfies Meta<typeof Tab>
export default meta

type Story = StoryObj<typeof meta>

/** The middle tab, selected. */
export const Playground: Story = {}

export const Disabled: Story = {
  args: { value: 'billing', children: 'Billing', disabled: true },
}
