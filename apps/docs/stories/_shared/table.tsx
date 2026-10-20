/** Shared rows for the Table part stories, so each shows its part in a real table. */
import { TableCell, TableHeaderCell, TableRow } from '@greese/react'

export const invoices = [
  { id: 'INV-001', client: 'Acme Ltd', total: '$1,200.00' },
  { id: 'INV-002', client: 'Globex', total: '$860.50' },
  { id: 'INV-003', client: 'Initech', total: '$3,400.00' },
]

export const headerRow = (
  <TableRow>
    <TableHeaderCell>Number</TableHeaderCell>
    <TableHeaderCell>Client</TableHeaderCell>
    <TableHeaderCell align="end">Total</TableHeaderCell>
  </TableRow>
)

export const bodyRows = invoices.map((r) => (
  <TableRow key={r.id}>
    <TableCell label="Number">{r.id}</TableCell>
    <TableCell label="Client">{r.client}</TableCell>
    <TableCell label="Total" align="end">
      {r.total}
    </TableCell>
  </TableRow>
))
