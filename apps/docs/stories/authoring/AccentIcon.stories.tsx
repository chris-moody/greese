import type { Meta, StoryObj } from '@storybook/react-vite'
import { FilmIcon } from '@greese/icons'
import { AccentIcon } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/AccentIcon',
  component: AccentIcon,
  args: { hue: 300, children: <FilmIcon /> },
  argTypes: {
    hue: { control: { type: 'range', min: 0, max: 360, step: 10 } },
    children: { control: false },
  },
} satisfies Meta<typeof AccentIcon>
export default meta

type Story = StoryObj<typeof meta>

/** An environment's icon in its hue: the theme's primary color, turned to it. */
export const Playground: Story = {}

/** One icon, around the color wheel. */
export const Hues: Story = {
  render: (args) => (
    <span style={{ display: 'inline-flex', gap: 'var(--greese-space-2)' }}>
      {[0, 60, 120, 180, 240, 300].map((hue) => (
        <AccentIcon {...args} key={hue} hue={hue} />
      ))}
    </span>
  ),
}
