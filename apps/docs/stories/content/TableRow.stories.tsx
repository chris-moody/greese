import type { Meta, StoryObj } from '@storybook/react-vite'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@greese/react'
import { bodyRows, headerRow } from '../_shared/table.tsx'

/** One row. Below a table's `stackBelow` breakpoint, each row becomes a card. */
const meta = {
  title: 'Content/TableRow',
  component: TableRow,
  args: {
    children: (
      <>
        <TableCell label="Number">INV-004</TableCell>
        <TableCell label="Client">Umbrella</TableCell>
        <TableCell label="Total" align="end">
          $95.00
        </TableCell>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <Table caption="Invoices" hoverable stackBelow="sm">
        <TableHead>{headerRow}</TableHead>
        <TableBody>
          {bodyRows}
          <Story />
        </TableBody>
      </Table>
    ),
  ],
} satisfies Meta<typeof TableRow>
export default meta

type Story = StoryObj<typeof meta>

/** The last row; resize below sm to see the rows stack. */
export const Playground: Story = {}
