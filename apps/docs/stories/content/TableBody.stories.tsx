import type { Meta, StoryObj } from '@storybook/react-vite'
import { Table, TableBody, TableHead } from '@greese/react'
import { bodyRows, headerRow } from '../_shared/table.tsx'

/** A table's data rows: a native `<tbody>`. Striped and hoverable tables style its rows. */
const meta = {
  title: 'Content/TableBody',
  component: TableBody,
  args: { children: bodyRows },
  decorators: [
    (Story) => (
      <Table caption="Invoices" striped>
        <TableHead>{headerRow}</TableHead>
        <Story />
      </Table>
    ),
  ],
} satisfies Meta<typeof TableBody>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
