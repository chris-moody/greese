import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tab, TabList, TabPanel, Tabs, Text } from '@greese-ui/react'

const sections = [
  'Overview',
  'Activity',
  'Settings',
  'Members',
  'Billing',
  'Integrations',
]

const meta = {
  title: 'Content/Tabs',
  component: Tabs,
  subcomponents: { TabList, Tab, TabPanel },
  args: {
    defaultValue: 'overview',
    children: (
      <>
        <TabList aria-label="Project">
          {sections.map((t) => (
            <Tab key={t} value={t.toLowerCase()}>
              {t}
            </Tab>
          ))}
        </TabList>
        {sections.map((t) => (
          <TabPanel key={t} value={t.toLowerCase()}>
            <Text>The {t.toLowerCase()} panel.</Text>
          </TabPanel>
        ))}
      </>
    ),
  },
} satisfies Meta<typeof Tabs>
export default meta

type Story = StoryObj<typeof meta>

/** Arrow keys move between tabs; on narrow screens the list scrolls sideways. */
export const Horizontal: Story = {}

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    defaultValue: 'profile',
    children: (
      <>
        <TabList aria-label="Account">
          <Tab value="profile">Profile</Tab>
          <Tab value="security">Security</Tab>
          <Tab value="billing" disabled>
            Billing
          </Tab>
        </TabList>
        <TabPanel value="profile">Profile settings.</TabPanel>
        <TabPanel value="security">Security settings.</TabPanel>
      </>
    ),
  },
}

/** `manual`: arrows move focus; Enter or Space selects. */
export const ManualActivation: Story = { args: { activation: 'manual' } }
