import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Accordion,
  AccordionItem,
  Collapsible,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from '@sauce-ui/react'

const meta = { title: 'Content/Disclosure' } satisfies Meta
export default meta

type Story = StoryObj

/** Native `<details name>`: opening one closes the others, with no JavaScript. */
export const ExclusiveAccordion: Story = {
  render: () => (
    <Accordion exclusive style={{ maxInlineSize: '36rem' }}>
      <AccordionItem title="How long does shipping take?" defaultOpen>
        Two to four business days within the country.
      </AccordionItem>
      <AccordionItem title="Can I return an item?">
        Yes, within 30 days, in its original condition.
      </AccordionItem>
      <AccordionItem title="Do you ship internationally?">
        To most countries.
      </AccordionItem>
    </Accordion>
  ),
}

export const SingleCollapsible: Story = {
  render: () => (
    <Collapsible title="Show advanced options" style={{ maxInlineSize: '36rem' }}>
      <Text>Advanced options live here.</Text>
    </Collapsible>
  ),
}

/** Arrow keys move between tabs; on narrow screens the tab list scrolls sideways. */
export const TabsHorizontalAndVertical: Story = {
  render: () => (
    <Stack gap={7}>
      <Tabs defaultValue="overview">
        <TabList aria-label="Project">
          {['Overview', 'Activity', 'Settings', 'Members', 'Billing', 'Integrations'].map(
            (t) => (
              <Tab key={t} value={t.toLowerCase()}>
                {t}
              </Tab>
            )
          )}
        </TabList>
        {['overview', 'activity', 'settings', 'members', 'billing', 'integrations'].map(
          (v) => (
            <TabPanel key={v} value={v}>
              <Text>The {v} panel.</Text>
            </TabPanel>
          )
        )}
      </Tabs>
      <Tabs defaultValue="profile" orientation="vertical">
        <TabList aria-label="Account">
          <Tab value="profile">Profile</Tab>
          <Tab value="security">Security</Tab>
          <Tab value="billing" disabled>
            Billing
          </Tab>
        </TabList>
        <TabPanel value="profile">Profile settings.</TabPanel>
        <TabPanel value="security">Security settings.</TabPanel>
      </Tabs>
    </Stack>
  ),
}
