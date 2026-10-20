import type { Meta, StoryObj } from '@storybook/react-vite'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@greese-ui/react'
import { bodyRows, headerRow } from '../_shared/table.tsx'

/** A data cell. `label` names it when rows stack into cards on phones. */
const meta = {
  title: 'Content/TableCell',
  component: TableCell,
  args: { label: 'Total', align: 'end', children: '$95.00' },
  argTypes: { align: { control: 'inline-radio', options: ['start', 'center', 'end'] } },
  decorators: [
    (Story) => (
      <Table caption="Invoices" stackBelow="sm">
        <TableHead>{headerRow}</TableHead>
        <TableBody>
          {bodyRows}
          <TableRow>
            <TableCell label="Number">INV-004</TableCell>
            <TableCell label="Client">Umbrella</TableCell>
            <Story />
          </TableRow>
        </TableBody>
      </Table>
    ),
  ],
} satisfies Meta<typeof TableCell>
export default meta

type Story = StoryObj<typeof meta>

/** The last cell; resize below sm to see its label. */
export const Playground: Story = {}
