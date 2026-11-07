import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { FilmIcon, ImageIcon, MusicNoteIcon } from '@greese/icons'
import { AccentIcon, EnvironmentSelect, type EnvironmentOption } from '@greese/authoring'
import '@greese/authoring/styles.css'

/** Each environment with its icon, tinted with its hue. */
const environments: EnvironmentOption[] = [
  {
    value: 'graphics',
    label: 'Graphics',
    hue: 150,
    icon: (
      <AccentIcon hue={150}>
        <ImageIcon />
      </AccentIcon>
    ),
  },
  {
    value: 'animation',
    label: 'Animation',
    hue: 300,
    icon: (
      <AccentIcon hue={300}>
        <FilmIcon />
      </AccentIcon>
    ),
  },
  { value: 'sound', label: 'Sound', icon: <MusicNoteIcon />, disabled: true },
]

const meta = {
  title: 'Authoring/EnvironmentSelect',
  component: EnvironmentSelect,
  args: {
    value: 'graphics',
    options: environments,
    onValueChange: () => undefined,
    label: 'Environment',
  },
  argTypes: {
    value: { control: false },
    options: { control: false },
    onValueChange: { control: false },
  },
} satisfies Meta<typeof EnvironmentSelect>
export default meta

type Story = StoryObj<typeof meta>

/**
 * The editor's environments, as a menu: choosing one moves the editor there.
 * The outline takes the current one's hue; Sound isn't open yet.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [environment, setEnvironment] = useState('graphics')
    return (
      <EnvironmentSelect {...args} value={environment} onValueChange={setEnvironment} />
    )
  },
}
