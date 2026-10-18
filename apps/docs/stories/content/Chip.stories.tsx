import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Chip, Stack } from '@sauce-ui/react'

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
