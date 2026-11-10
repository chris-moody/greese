import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { AuthoringTheme } from '@greese/authoring'
import { Combobox, Grid, Input, Select, Stack, Text } from '@greese/react'
import '@greese/authoring/styles.css'

const Fields = function Fields() {
  const [fill, setFill] = useState<string | null>('currentColor')
  return (
    <Stack gap={2}>
      <Input aria-label="Name" defaultValue="Star" />
      <Select aria-label="Fill rule" defaultValue="nonzero">
        <option value="nonzero">nonzero</option>
        <option value="evenodd">evenodd</option>
      </Select>
      <Combobox
        label="Fill"
        hideLabel
        allowCustomValue
        value={fill}
        onValueChange={setFill}
        options={['currentColor', 'none']}
      />
    </Stack>
  )
}

const meta = {
  title: 'Authoring/AuthoringTheme',
  component: AuthoringTheme,
  args: { children: <Fields /> },
  argTypes: { children: { control: false } },
  parameters: { tryIt: { scope: { Fields } } },
} satisfies Meta<typeof AuthoringTheme>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Every authoring app's controls alike: inside the theme, fields asked for
 * at their default `md` size are drawn at `sm`, as dense panels want.
 */
export const Playground: Story = {}

/** The same fields at their default size, outside the theme, and inside it. */
export const Compared: Story = {
  render: function Render() {
    return (
      <Grid container columns={2} gap={4}>
        <Stack gap={2}>
          <Text variant="caption" tone="muted">
            Outside
          </Text>
          <Fields />
        </Stack>
        <Stack gap={2}>
          <Text variant="caption" tone="muted">
            In AuthoringTheme
          </Text>
          <AuthoringTheme>
            <Fields />
          </AuthoringTheme>
        </Stack>
      </Grid>
    )
  },
}
