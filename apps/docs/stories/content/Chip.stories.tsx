import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Chip, Stack } from '@greese/react'

const meta = {
  title: 'Content/Chip',
  component: Chip,
  args: { children: 'Design' },
} satisfies Meta<typeof Chip>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Removable: each remove button is named for its chip ("Remove Design"), and
 * removing one takes it out of the list.
 */
export const Playground: Story = {
  render: function Removable(args) {
    const [chips, setChips] = useState(['Design', 'Code', 'Writing'])
    return (
      <Stack direction="row" gap={2} wrap="wrap">
        {chips.map((chip) => (
          <Chip
            {...args}
            key={chip}
            onRemove={() => setChips((all) => all.filter((c) => c !== chip))}
          >
            {chip}
          </Chip>
        ))}
      </Stack>
    )
  },
}

export const Selectable: Story = {
  args: {
    selectable: true,
    defaultSelected: true,
    children: 'In stock',
  },
}

/**
 * `tone` tints a plain chip, and colors a selectable one when it's selected.
 * Without a tone, chips are plain and select to primary.
 */
export const Tones: Story = {
  render: () => (
    <Stack gap={3}>
      <Stack direction="row" gap={2} wrap="wrap">
        {(
          [
            'neutral',
            'primary',
            'secondary',
            'tertiary',
            'accent',
            'positive',
            'negative',
            'warning',
            'info',
          ] as const
        ).map((tone) => (
          <Chip key={tone} tone={tone}>
            {tone}
          </Chip>
        ))}
      </Stack>
      <Stack direction="row" gap={2} wrap="wrap">
        <Chip selectable defaultSelected tone="secondary">
          Selected secondary
        </Chip>
        <Chip selectable tone="secondary">
          Not selected
        </Chip>
      </Stack>
    </Stack>
  ),
}

export const Filters: Story = {
  render: function Render() {
    const [tags, setTags] = useState(['Design', 'Frontend', 'Accessibility'])
    return (
      <Stack direction="row" gap={2} wrap="wrap">
        {tags.map((tag) => (
          <Chip key={tag} onRemove={() => setTags((t) => t.filter((x) => x !== tag))}>
            {tag}
          </Chip>
        ))}
        <Chip selectable>On sale</Chip>
      </Stack>
    )
  },
}
