import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Chip, Stack } from '@greese-ui/react'

const meta = {
  title: 'Content/Chip',
  component: Chip,
  args: { children: 'Design', onRemove: () => {} },
} satisfies Meta<typeof Chip>
export default meta

type Story = StoryObj<typeof meta>

/** Removable: the remove button is named "Remove Design". */
export const Removable: Story = {}

export const Selectable: Story = {
  args: {
    selectable: true,
    defaultSelected: true,
    onRemove: undefined,
    children: 'In stock',
  },
}

/**
 * `tone` tints a plain chip, and colours a selectable one when it's selected.
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
