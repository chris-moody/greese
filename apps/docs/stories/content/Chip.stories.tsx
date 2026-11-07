import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button, Chip, Stack } from '@greese/react'

const meta = {
  title: 'Content/Chip',
  component: Chip,
  args: { children: 'Design' },
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
  },
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

/**
 * `size` sets the height, the inline padding and the text size together. A
 * chip runs smaller than an input of the same name, because it is a label
 * rather than something you type in; `md` is the default.
 */
export const Sizes: Story = {
  render: function Sizes(args) {
    return (
      <Stack direction="row" gap={2} align="center" wrap="wrap">
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <Chip {...args} key={size} size={size}>
            {size}
          </Chip>
        ))}
      </Stack>
    )
  },
}

/** The remove button scales with the chip, so a small one still fits it. */
export const SmallRemovable: Story = {
  args: { size: 'xs', children: 'Design' },
  render: function SmallRemovable(args) {
    const [removed, setRemoved] = useState(false)
    return removed ? (
      <Button size="xs" variant="ghost" onClick={() => setRemoved(false)}>
        Put Design back
      </Button>
    ) : (
      <Chip {...args} onRemove={() => setRemoved(true)} />
    )
  },
}
