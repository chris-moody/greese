import type { Meta, StoryObj } from '@storybook/react-vite'
import { Combobox } from '@sauce-ui/react'
import { countries } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Forms/Combobox',
  component: Combobox,
  args: {
    label: 'Country',
    name: 'country',
    options: countries,
    placeholder: 'Start typing…',
    description: 'Try “cote” or “mexico”.',
  },
  decorators: [(Story) => <div style={{ maxInlineSize: '24rem' }}>{Story()}</div>],
} satisfies Meta<typeof Combobox>
export default meta

type Story = StoryObj<typeof meta>

/** Type to filter (accents optional); arrows, Enter, Escape; submits the value. */
export const Playground: Story = {}

export const CustomValues: Story = {
  args: {
    label: 'Tag',
    options: ['bug', 'feature', 'docs'],
    allowCustomValue: true,
    description: 'Free text allowed: type a new tag.',
    placeholder: undefined,
  },
}

export const WithDisabledOptions: Story = {
  args: {
    label: 'Plan',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
      { value: 'enterprise', label: 'Enterprise (contact sales)', disabled: true },
    ],
    description: undefined,
    placeholder: undefined,
  },
}
