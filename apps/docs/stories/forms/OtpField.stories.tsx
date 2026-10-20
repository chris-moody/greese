import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, OtpField } from '@greese/react'

const meta = {
  title: 'Forms/OtpField',
  component: OtpField,
  args: { length: 6 },
  argTypes: {
    mode: { control: 'inline-radio', options: ['numeric', 'alphanumeric'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  render: (args) => (
    <Field label="Verification code" description="We sent a 6-digit code to your phone.">
      <OtpField {...args} />
    </Field>
  ),
} satisfies Meta<typeof OtpField>
export default meta

type Story = StoryObj<typeof meta>

/** Type, paste, or let the phone fill it in from the SMS. */
export const Playground: Story = {}

export const PartlyFilled: Story = { args: { defaultValue: '204' } }

export const Masked: Story = { args: { length: 4, mask: true, defaultValue: '12' } }

export const Invalid: Story = {
  render: (args) => (
    <Field label="Verification code" error="That code has expired. We sent a new one.">
      <OtpField {...args} defaultValue="482913" />
    </Field>
  ),
}

export const Alphanumeric: Story = {
  args: { mode: 'alphanumeric', length: 8, size: 'sm', defaultValue: 'K7Q2' },
}
