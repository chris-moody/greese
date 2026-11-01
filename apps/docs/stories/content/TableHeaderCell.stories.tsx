import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
  type SortDirection,
} from '@greese/react'
import { bodyRows } from '../_shared/table.tsx'

/** A column or row header. With `onSort`, a button that reports `aria-sort`. */
const meta = {
  title: 'Content/TableHeaderCell',
  component: TableHeaderCell,
  args: { children: 'Total', align: 'end', sort: 'descending' },
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

/** The Total header, sortable: each press flips the order. */
export const Playground: Story = {
  render: function Sortable(args) {
    const [sort, setSort] = useState<SortDirection>(args.sort ?? 'descending')
    return (
      <TableHeaderCell
        {...args}
        sort={sort}
        onSort={() => setSort((s) => (s === 'ascending' ? 'descending' : 'ascending'))}
      />
    )
  },
}

export const NotSortable: Story = { args: { sort: undefined, onSort: undefined } }
