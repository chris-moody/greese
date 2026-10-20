import type { Meta, StoryObj } from '@storybook/react-vite'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '@greese/react'
import { bodyRows } from '../_shared/table.tsx'

/** A column or row header. With `onSort`, a button that reports `aria-sort`. */
const meta = {
  title: 'Content/TableHeaderCell',
  component: TableHeaderCell,
  args: { children: 'Total', align: 'end', sort: 'descending', onSort: () => {} },
  argTypes: {
    sort: { control: 'inline-radio', options: ['none', 'ascending', 'descending'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
  },
  decorators: [
    (Story) => (
      <Table caption="Invoices">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Number</TableHeaderCell>
            <TableHeaderCell>Client</TableHeaderCell>
            <Story />
          </TableRow>
        </TableHead>
        <TableBody>{bodyRows}</TableBody>
      </Table>
    ),
  ],
} satisfies Meta<typeof TableHeaderCell>
export default meta

type Story = StoryObj<typeof meta>

/** The Total header, sortable. */
export const Playground: Story = {}

export const NotSortable: Story = { args: { sort: undefined, onSort: undefined } }
