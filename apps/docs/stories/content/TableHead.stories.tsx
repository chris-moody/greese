import type { Meta, StoryObj } from '@storybook/react-vite'
import { Table, TableBody, TableHead } from '@greese/react'
import { bodyRows, headerRow } from '../_shared/table.tsx'

/** A table's header rows: a native `<thead>`. */
const meta = {
  title: 'Content/TableHead',
  component: TableHead,
  args: { children: headerRow },
  decorators: [
    (Story) => (
      <Table caption="Invoices">
        <Story />
        <TableBody>{bodyRows}</TableBody>
      </Table>
    ),
  ],
} satisfies Meta<typeof TableHead>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
