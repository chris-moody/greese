import type { Meta, StoryObj } from '@storybook/react-vite'
import { Radio, RadioGroup } from '@greese/react'

const meta = {
  title: 'Forms/RadioGroup',
  component: RadioGroup,
  subcomponents: { Radio },
  args: {
    label: 'Plan',
    defaultValue: 'pro',
    children: (
      <>
        <Radio value="free" label="Free" description="For trying things out" />
        <Radio value="pro" label="Pro" description="For individuals" />
        <Radio value="team" label="Team" description="Billed per seat" />
      </>
    ),
  },
} satisfies Meta<typeof RadioGroup>
export default meta

type Story = StoryObj<typeof meta>

/** Native radios: arrow keys move the selection. */
export const Playground: Story = {}

export const Horizontal: Story = { args: { direction: { xs: 'column', md: 'row' } } }

export const WithError: Story = {
  args: { error: 'The Team plan needs 3 or more seats.' },
}
