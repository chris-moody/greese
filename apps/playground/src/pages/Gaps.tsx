import { useState, type JSX } from 'react'
import {
  Button,
  Combobox,
  DateField,
  Drawer,
  NumberField,
  Segment,
  SegmentedControl,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@greese-ui/react'
import '@greese-ui/react/base.css'
import '@greese-ui/react/styles.css'

const countries = [
  { value: 'br', label: 'Brasil' },
  { value: 'ci', label: "Côte d'Ivoire" },
  { value: 'mx', label: 'México' },
  { value: 'nz', label: 'New Zealand' },
  { value: 'no', label: 'Norway', disabled: true },
]

/** Phase 7 fixtures for e2e/gaps.spec.ts. */
export const Gaps = (): JSX.Element => {
  const [country, setCountry] = useState<string | null>(null)
  return (
    <main style={{ padding: '1rem', maxInlineSize: '40rem' }}>
      <Stack gap={5}>
        <Combobox
          label="Country"
          name="country"
          options={countries}
          onValueChange={setCountry}
        />
        <output data-testid="country">{country ?? ''}</output>
        <NumberField label="Quantity" name="qty" defaultValue={5} min={0} max={20} />
        <DateField label="Due date" name="due" />
        <SegmentedControl label="View" name="view" defaultValue="list">
          <Segment value="list">List</Segment>
          <Segment value="grid">Grid</Segment>
          <Segment value="board">Board</Segment>
        </SegmentedControl>
        <Table caption="Invoices" stackBelow="sm" data-testid="table">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Number</TableHeaderCell>
              <TableHeaderCell align="end">Total</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow data-testid="row">
              <TableCell label="Number" data-testid="cell">
                INV-001
              </TableCell>
              <TableCell label="Total" align="end">
                $120.00
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Drawer
          trigger={<Button>Open sheet</Button>}
          title="Filters"
          placement={{ xs: 'bottom', md: 'end' }}
        >
          <Text>Drag the header toward the edge to dismiss.</Text>
        </Drawer>
      </Stack>
    </main>
  )
}
