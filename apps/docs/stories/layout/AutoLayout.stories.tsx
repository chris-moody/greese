import type { Meta, StoryObj } from '@storybook/react-vite'
import { AutoLayout, AutoLayoutItem, Field, Input, Select } from '@greese-ui/react'
import { Tile } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Layout/AutoLayout',
  component: AutoLayout,
  subcomponents: { AutoLayoutItem },
  args: { gap: 3 },
} satisfies Meta<typeof AutoLayout>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Full width on phones. From md, items take 4 of 12 columns; the first may
 * grow to 6 and the last to 8 when their row has room.
 */
export const Playground: Story = {
  render: (args) => (
    <AutoLayout {...args}>
      <AutoLayoutItem size={{ xs: 12, md: 4 }} maxSize={{ md: 6 }}>
        <Tile>4 → 6</Tile>
      </AutoLayoutItem>
      <AutoLayoutItem size={{ xs: 12, md: 4 }}>
        <Tile>4</Tile>
      </AutoLayoutItem>
      <AutoLayoutItem size={{ xs: 12, md: 4 }}>
        <Tile>4</Tile>
      </AutoLayoutItem>
      <AutoLayoutItem size={{ xs: 12, md: 4 }} maxSize={{ md: 8 }}>
        <Tile>4 → 8 (alone on its row)</Tile>
      </AutoLayoutItem>
    </AutoLayout>
  ),
}

/** A form whose fields widen into whatever their row leaves over. */
export const Form: Story = {
  render: (args) => (
    <AutoLayout {...args} gap={{ xs: 3, md: 4 }}>
      <AutoLayoutItem size={{ xs: 12, sm: 6 }}>
        <Field label="First name">
          <Input />
        </Field>
      </AutoLayoutItem>
      <AutoLayoutItem size={{ xs: 12, sm: 6 }}>
        <Field label="Last name">
          <Input />
        </Field>
      </AutoLayoutItem>
      <AutoLayoutItem size={{ xs: 12, md: 7 }} maxSize={{ md: 12 }}>
        <Field label="Street">
          <Input />
        </Field>
      </AutoLayoutItem>
      <AutoLayoutItem size={{ xs: 8, md: 3 }} maxSize={{ xs: 12 }}>
        <Field label="City">
          <Input />
        </Field>
      </AutoLayoutItem>
      <AutoLayoutItem size={{ xs: 4, md: 2 }}>
        <Field label="Code">
          <Input />
        </Field>
      </AutoLayoutItem>
      <AutoLayoutItem size={{ xs: 12, md: 4 }}>
        <Field label="Country">
          <Select placeholder="Choose…">
            <option>Norway</option>
          </Select>
        </Field>
      </AutoLayoutItem>
    </AutoLayout>
  ),
}

/** `columns` changes the unit: here a row of 5. */
export const Columns: Story = {
  render: () => (
    <AutoLayout columns={5} gap={2}>
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <AutoLayoutItem key={n} size={1} maxSize={n > 5 ? 5 : 1}>
          <Tile>{n}</Tile>
        </AutoLayoutItem>
      ))}
    </AutoLayout>
  ),
}
