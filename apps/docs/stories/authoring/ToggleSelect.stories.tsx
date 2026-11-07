import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { GridIcon } from '@greese/icons'
import { ToggleSelect } from '@greese/authoring'
import '@greese/authoring/styles.css'

const divisions = [
  { value: '4', label: '1/4' },
  { value: '8', label: '1/8' },
  { value: '16', label: '1/16' },
]

const meta = {
  title: 'Authoring/ToggleSelect',
  component: ToggleSelect,
  args: {
    label: 'Snap',
    icon: <GridIcon />,
    pressed: true,
    onPressedChange: () => undefined,
    value: '8',
    onChange: () => undefined,
    options: divisions,
    disabled: false,
  },
  argTypes: {
    icon: { control: false },
    pressed: { control: false },
    onPressedChange: { control: false },
    value: { control: false },
    onChange: { control: false },
    options: { control: false },
  },
} satisfies Meta<typeof ToggleSelect>
export default meta

type Story = StoryObj<typeof meta>

/** Snapping, and to what: the list takes a choice only while Snap is on. */
export const Playground: Story = {
  render: function Playground(args) {
    const [snap, setSnap] = useState(true)
    const [division, setDivision] = useState('8')
    return (
      <ToggleSelect
        {...args}
        pressed={snap}
        onPressedChange={setSnap}
        value={division}
        onChange={setDivision}
      />
    )
  },
}

/** Beside the toggle, for a header one row tall, like a timeline's. */
export const Horizontal: Story = {
  render: function Horizontal(args) {
    const [snap, setSnap] = useState(true)
    const [division, setDivision] = useState('8')
    return (
      <ToggleSelect
        {...args}
        orientation="horizontal"
        pressed={snap}
        onPressedChange={setSnap}
        value={division}
        onChange={setDivision}
      />
    )
  },
}
