import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  Combobox,
  DateField,
  NumberField,
  Segment,
  SegmentedControl,
  Stack,
  Text,
} from '@sauce-ui/react'

const meta = { title: 'Forms/Pickers' } satisfies Meta
export default meta

type Story = StoryObj

const countries = [
  'Argentina',
  'Australia',
  'Brasil',
  'Canada',
  "Côte d'Ivoire",
  'Denmark',
  'España',
  'France',
  'Germany',
  'India',
  'Japan',
  'México',
  'New Zealand',
  'Norway',
  'Portugal',
  'South Africa',
  'Sverige',
  'United Kingdom',
  'United States',
]

/** Type to filter (accents optional); arrows, Enter, Escape; submits the value. */
export const ComboboxStory: Story = {
  name: 'Combobox',
  render: function Render() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <Stack gap={4} maxW="24rem">
        <Combobox
          label="Country"
          name="country"
          options={countries}
          placeholder="Start typing…"
          description="Try “cote” or “mexico”."
          onValueChange={setValue}
        />
        <Combobox
          label="Tag"
          options={['bug', 'feature', 'docs']}
          allowCustomValue
          description="Free text allowed: type a new tag."
        />
        <Text size="sm" tone="muted">
          Selected: {value ?? 'nothing'}
        </Text>
      </Stack>
    )
  },
}

/** Spinbutton: arrows, Page Up/Down, Home/End. A number pad on phones. */
export const NumberAndDate: Story = {
  render: () => (
    <Stack gap={4} maxW="24rem">
      <NumberField label="Quantity" defaultValue={1} min={1} max={99} />
      <NumberField
        label="Discount"
        description="0–1 in steps of 0.05"
        defaultValue={0.1}
        min={0}
        max={1}
        step={0.05}
      />
      <DateField label="Due date" min="2026-01-01" />
      <DateField label="Reminder" type="time" />
    </Stack>
  ),
}

export const Segmented: Story = {
  render: () => (
    <Stack gap={4} align="start">
      <SegmentedControl label="View" defaultValue="list">
        <Segment value="list">List</Segment>
        <Segment value="grid">Grid</Segment>
        <Segment value="board">Board</Segment>
      </SegmentedControl>
      <SegmentedControl label="Range" hideLabel={false} size="sm" defaultValue="7d">
        <Segment value="24h">24h</Segment>
        <Segment value="7d">7 days</Segment>
        <Segment value="30d">30 days</Segment>
        <Segment value="all" disabled>
          All time
        </Segment>
      </SegmentedControl>
    </Stack>
  ),
}
