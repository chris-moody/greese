import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { NavHistory, type NavHistoryEntry } from '@greese/authoring'
import '@greese/authoring/styles.css'

const visited: NavHistoryEntry[] = [
  { id: '1', label: 'Root' },
  { id: '2', label: 'Toolbar' },
  { id: '3', label: 'Button' },
]

const meta = {
  title: 'Authoring/NavHistory',
  component: NavHistory,
  args: { entries: visited, onBack: () => undefined, onJump: () => undefined, limit: 30 },
  argTypes: {
    entries: { control: false },
    onBack: { control: false },
    onJump: { control: false },
  },
} satisfies Meta<typeof NavHistory>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Back, and a menu of the places the editor has been, newest first. Back
 * drops the last place; a place from the menu drops the ones after it.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [entries, setEntries] = useState(visited)
    return (
      <NavHistory
        {...args}
        entries={entries}
        onBack={() => setEntries(entries.slice(0, -1))}
        onJump={(index) => setEntries(entries.slice(0, index + 1))}
      />
    )
  },
}
