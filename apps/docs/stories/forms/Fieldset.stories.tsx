import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fieldset, Grid, TextField } from '@greese/react'

const meta = {
  title: 'Forms/Fieldset',
  component: Fieldset,
  args: {
    legend: 'Shipping address',
    description: 'Where we deliver your order.',
    style: { maxInlineSize: '32rem' },
    children: (
      <>
        <TextField label="Street" autoComplete="street-address" />
        <Grid container columns={{ xs: 1, sm: 2 }} gap={4}>
          <TextField label="City" autoComplete="address-level2" />
          <TextField label="Postcode" autoComplete="postal-code" />
        </Grid>
      </>
    ),
  },
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'card'] } },
} satisfies Meta<typeof Fieldset>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Card: Story = { args: { variant: 'card' } }

/** `disabled` disables every control inside, natively. */
export const Disabled: Story = { args: { variant: 'card', disabled: true } }

export const WithError: Story = {
  args: { variant: 'card', error: 'We don’t deliver to that postcode yet.' },
}
