import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
  type SortDirection,
} from '@sauce-ui/react'

const meta = {
  title: 'Content/Table',
  component: Table,
  subcomponents: {
    TableHead,
    TableBody,
    TableFoot,
    TableRow,
    TableHeaderCell,
    TableCell,
  },
  args: { caption: 'Invoices' },
} satisfies Meta<typeof Table>
export default meta

type Story = StoryObj<typeof meta>

const invoices = [
  { id: 'INV-001', client: 'Acme Ltd', status: 'Paid', total: 1200 },
  { id: 'INV-002', client: 'Globex', status: 'Overdue', total: 860.5 },
  { id: 'INV-003', client: 'Initech', status: 'Draft', total: 3400 },
  { id: 'INV-004', client: 'Umbrella', status: 'Paid', total: 95 },
  { id: 'INV-005', client: 'Hooli', status: 'Paid', total: 2210 },
  { id: 'INV-006', client: 'Stark', status: 'Overdue', total: 18000 },
]
const tone = { Paid: 'positive', Overdue: 'negative', Draft: 'neutral' } as const
const money = (n: number) =>
  n.toLocaleString('en-NZ', { style: 'currency', currency: 'NZD' })

/** Sortable columns (`aria-sort`); rows stack into cards below sm. Resize to see. */
export const SortableAndResponsive: Story = {
  render: function Render() {
    const [sort, setSort] = useState<{ key: 'client' | 'total'; dir: SortDirection }>({
      key: 'total',
      dir: 'descending',
    })
    const rows = [...invoices].sort((a, b) => {
      const order = a[sort.key] < b[sort.key] ? -1 : a[sort.key] > b[sort.key] ? 1 : 0
      return sort.dir === 'ascending' ? order : -order
    })
    const sortBy = (key: 'client' | 'total') =>
      setSort((s) => ({
        key,
        dir: s.key === key && s.dir === 'ascending' ? 'descending' : 'ascending',
      }))
    return (
      <Table caption="Invoices" stackBelow="sm" hoverable>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Number</TableHeaderCell>
            <TableHeaderCell
              sort={sort.key === 'client' ? sort.dir : 'none'}
              onSort={() => sortBy('client')}
            >
              Client
            </TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell
              align="end"
              sort={sort.key === 'total' ? sort.dir : 'none'}
              onSort={() => sortBy('total')}
            >
              Total
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell label="Number">{r.id}</TableCell>
              <TableCell label="Client">{r.client}</TableCell>
              <TableCell label="Status">
                <Badge tone={tone[r.status as keyof typeof tone]}>{r.status}</Badge>
              </TableCell>
              <TableCell label="Total" align="end">
                {money(r.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  },
}

/** Compact and striped, with a header that sticks inside a 12rem scroll region. */
export const CompactSticky: Story = {
  render: () => (
    <Table caption="Activity" density="compact" striped stickyHeader maxHeight="12rem">
      <TableHead>
        <TableRow>
          <TableHeaderCell>Time</TableHeaderCell>
          <TableHeaderCell>Event</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: 14 }, (_, i) => (
          <TableRow key={i}>
            <TableCell>{`09:${String(10 + i * 3).padStart(2, '0')}`}</TableCell>
            <TableCell>Deployment step {i + 1} finished</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}
