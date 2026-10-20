import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableRow,
} from '@greese/react'
import { bodyRows, headerRow } from '../_shared/table.tsx'

/** A table's summary rows: a native `<tfoot>`. */
const meta = {
  title: 'Content/TableFoot',
  component: TableFoot,
  args: {
    children: (
      <TableRow>
        <TableCell colSpan={2}>Total</TableCell>
        <TableCell align="end">$5,460.50</TableCell>
      </TableRow>
    ),
  },
  decorators: [
    (Story) => (
      <Table caption="Invoices">
        <TableHead>{headerRow}</TableHead>
        <TableBody>{bodyRows}</TableBody>
        <Story />
      </Table>
    ),
  ],
} satisfies Meta<typeof TableFoot>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
