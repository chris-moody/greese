import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Slider } from '@greese-ui/react'

const meta = {
  title: 'Forms/Slider',
  component: Slider,
  args: { defaultValue: 40, min: 0, max: 100, step: 1 },
  render: (args) => (
    <Field label="Volume" style={{ maxInlineSize: '24rem' }}>
      <Slider {...args} />
    </Field>
  ),
} satisfies Meta<typeof Slider>
export default meta

type Story = StoryObj<typeof meta>

/** Native range input: arrows, Page Up/Down, Home/End and touch all work. */
export const Playground: Story = {}

export const Stepped: Story = { args: { min: 0, max: 10, step: 2, defaultValue: 4 } }
