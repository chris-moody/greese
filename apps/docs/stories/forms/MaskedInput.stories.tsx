import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Field, Grid, MaskedInput, Text } from '@greese/react'

const meta = {
  title: 'Forms/MaskedInput',
  component: MaskedInput,
  args: { mask: '(999) 999-9999', placeholder: '(555) 123-4567' },
  render: (args) => (
    <Field label="Phone" description="Digits only; the formatting is added for you.">
      <MaskedInput {...args} />
    </Field>
  ),
  decorators: [(Story) => <div style={{ maxInlineSize: '20rem' }}>{Story()}</div>],
} satisfies Meta<typeof MaskedInput>
export default meta

type Story = StoryObj<typeof meta>

/** The phone keypad opens on touch devices for digit-only masks. */
export const Playground: Story = {}

/** `9` digit, `a`/`A` letter, `h`/`H` hex digit, `*` letter or digit. */
export const Patterns: Story = {
  render: () => (
    <Grid container gap={4}>
      <Field label="Card number">
        <MaskedInput mask="9999 9999 9999 9999" placeholder="4242 4242 4242 4242" />
      </Field>
      <Field label="Expiry">
        <MaskedInput mask="99/99" placeholder="MM/YY" />
      </Field>
      <Field label="Licence plate">
        <MaskedInput mask="AA-9999" defaultValue="AB12" />
      </Field>
      <Field label="Color">
        <MaskedInput mask="#hhhhhh" defaultValue="3b82f6" />
      </Field>
    </Grid>
  ),
}

/** Controlled: the value is the raw characters, without literals. */
export const Controlled: Story = {
  render: function Render() {
    const [raw, setRaw] = useState('5551')
    return (
      <Grid container gap={2}>
        <Field label="Phone">
          <MaskedInput mask="+1 (999) 999-9999" value={raw} onValueChange={setRaw} />
        </Field>
        <Text variant="p3" tone="muted">
          Raw value: {raw || '(empty)'}
        </Text>
      </Grid>
    )
  },
}
