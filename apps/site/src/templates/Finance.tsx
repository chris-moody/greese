/**
 * Finance: a personal finance dashboard. Net worth and account totals as
 * stats, a twelve-month cash-flow chart drawn in CSS, budgets as progress
 * bars, recent transactions in a table that stacks on phones, and the
 * accounts list. Transfer opens a dialog with a form.
 */
import { useState, type JSX } from 'react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  Field,
  Grid,
  Heading,
  List,
  ListItem,
  NumberField,
  Progress,
  SegmentedControl,
  Segment,
  Select,
  Stack,
  Stat,
  StatGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  toast,
} from '@greese/react'
import { PlusIcon, SendIcon, TrendDownIcon, TrendUpIcon } from '@greese/icons'

const money = (n: number, cents = false) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents ? 2 : 0,
    minimumFractionDigits: cents ? 2 : 0,
  })

const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
const income = [6.2, 6.2, 6.4, 6.4, 7.9, 6.4, 6.4, 6.6, 6.6, 6.6, 8.1, 6.6]
const spending = [4.8, 6.9, 4.1, 4.4, 4.6, 5.2, 4.9, 5.6, 6.1, 4.7, 5.0, 4.3]

const budgets = [
  { name: 'Groceries', spent: 412, limit: 600 },
  { name: 'Dining out', spent: 286, limit: 250 },
  { name: 'Transport', spent: 96, limit: 180 },
  { name: 'Subscriptions', spent: 64, limit: 80 },
]

const transactions = [
  { id: 1, date: 'Oct 22', name: 'Whole Grain Market', category: 'Groceries', amount: -84.12 },
  { id: 2, date: 'Oct 21', name: 'Payroll: Northwind', category: 'Income', amount: 3300 },
  { id: 3, date: 'Oct 20', name: 'Metro card top-up', category: 'Transport', amount: -40 },
  { id: 4, date: 'Oct 19', name: 'Sushi Ko', category: 'Dining out', amount: -62.5 },
  { id: 5, date: 'Oct 18', name: 'Streamly', category: 'Subscriptions', amount: -15.99 },
  { id: 6, date: 'Oct 17', name: 'Transfer to savings', category: 'Transfer', amount: -500 },
]

const accounts = [
  { name: 'Everyday checking', detail: 'Harbor Bank ··· 4821', balance: 4280.17 },
  { name: 'High-yield savings', detail: 'Harbor Bank ··· 0093', balance: 8200 },
  { name: 'Index portfolio', detail: 'Fieldstone ··· 7710', balance: 151900 },
  { name: 'Travel card', detail: 'Arc Credit ··· 3346', balance: -9840.55 },
]

const categoryTone = {
  Income: 'positive',
  Transfer: 'neutral',
  Groceries: 'primary',
  'Dining out': 'warning',
  Transport: 'info',
  Subscriptions: 'secondary',
} as const

/** Income and spending by month, as paired bars: CSS heights, no chart library. */
const CashFlow = (): JSX.Element => {
  const max = Math.max(...income, ...spending)
  const net = income.reduce((a, b) => a + b, 0) - spending.reduce((a, b) => a + b, 0)
  return (
    <Stack gap={3}>
      <div
        className="tpl-chart"
        role="img"
        aria-label={`Cash flow for the last twelve months: ${money(net * 1000)} saved in all.`}
      >
        {months.map((month, i) => (
          <div key={month} className="tpl-chart-month">
            <div className="tpl-chart-pair">
              <span
                className="tpl-chart-bar tpl-chart-bar--in"
                style={{ blockSize: `${(income[i]! / max) * 100}%` }}
              />
              <span
                className="tpl-chart-bar tpl-chart-bar--out"
                style={{ blockSize: `${(spending[i]! / max) * 100}%` }}
              />
            </div>
            <Text variant="caption" tone="muted">
              {month}
            </Text>
          </div>
        ))}
      </div>
      <Stack direction="row" gap={4} wrap="wrap">
        <Text variant="caption" tone="muted" className="tpl-key tpl-key--in">
          Income
        </Text>
        <Text variant="caption" tone="muted" className="tpl-key tpl-key--out">
          Spending
        </Text>
      </Stack>
    </Stack>
  )
}

const TransferDialog = (): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<number | null>(250)
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Transfer money"
      trigger={<Button startIcon={<SendIcon />}>Transfer</Button>}
      footer={
        <Stack direction="row" gap={2} justify="end">
          <Button variant="ghost" tone="neutral" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!amount}
            onClick={() => {
              setOpen(false)
              toast({ title: 'Transfer scheduled', description: `${money(amount ?? 0, true)} arrives tomorrow.`, tone: 'positive' })
            }}
          >
            Send {amount ? money(amount, true) : ''}
          </Button>
        </Stack>
      }
    >
      <Stack gap={4}>
        <Field label="From">
          <Select defaultValue="checking">
            <option value="checking">Everyday checking ··· 4821</option>
            <option value="savings">High-yield savings ··· 0093</option>
          </Select>
        </Field>
        <Field label="To">
          <Select defaultValue="savings">
            <option value="savings">High-yield savings ··· 0093</option>
            <option value="card">Travel card ··· 3346</option>
          </Select>
        </Field>
        <NumberField label="Amount (USD)" value={amount} onValueChange={setAmount} min={1} step={50} />
      </Stack>
    </Dialog>
  )
}

export const Finance = (): JSX.Element => {
  const [range, setRange] = useState('12m')
  return (
    <Stack gap={5} className="tpl-page" greese={{ enter: 'theme', stagger: 0.06 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={3} justify="between" align={{ sm: 'end' }}>
        <Stack gap={1}>
          <Text tone="muted">Thursday, October 23</Text>
          <Heading level={1} variant="h3">
            Good morning, Alex
          </Heading>
        </Stack>
        <Stack direction="row" gap={2}>
          <Button variant="soft" tone="neutral" startIcon={<PlusIcon />}>
            Add account
          </Button>
          <TransferDialog />
        </Stack>
      </Stack>

      <Card variant="outline">
        <StatGroup>
          <Stat
            label="Net worth"
            value={money(184320)}
            description="up 2.4% this month"
            tone="positive"
            media={<TrendUpIcon />}
          />
          <Stat label="Cash" value={money(12480)} description="across 2 accounts" tone="muted" />
          <Stat label="Investments" value={money(151900)} description="up 3.1%" tone="positive" />
          <Stat
            label="Debt"
            value={money(-9840)}
            description="down 6% since September"
            tone="negative"
            media={<TrendDownIcon />}
          />
        </StatGroup>
      </Card>

      <Grid container columns={12} gap={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outline">
            <Stack direction="row" justify="between" align="center" gap={3} wrap="wrap">
              <Heading level={2} variant="h5">
                Cash flow
              </Heading>
              <SegmentedControl label="Range" hideLabel size="sm" value={range} onValueChange={setRange}>
                <Segment value="6m">6 months</Segment>
                <Segment value="12m">12 months</Segment>
              </SegmentedControl>
            </Stack>
            <CashFlow />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outline">
            <Heading level={2} variant="h5">
              October budgets
            </Heading>
            <Stack gap={4}>
              {budgets.map((b) => {
                const over = b.spent > b.limit
                return (
                  <Stack key={b.name} gap={1}>
                    <Stack direction="row" justify="between">
                      <Text variant="p3" weight="semibold">
                        {b.name}
                      </Text>
                      <Text variant="p3" tone={over ? 'negative' : 'muted'}>
                        {money(b.spent)} of {money(b.limit)}
                      </Text>
                    </Stack>
                    <Progress
                      value={Math.min(b.spent, b.limit)}
                      max={b.limit}
                      size="sm"
                      aria-label={`${b.name}: ${money(b.spent)} of ${money(b.limit)}`}
                      className={over ? 'tpl-over' : undefined}
                    />
                  </Stack>
                )
              })}
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outline">
            <Table caption="Recent transactions" stackBelow="sm" hoverable>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell align="end">Amount</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell label="Date">{t.date}</TableCell>
                    <TableCell label="Description">{t.name}</TableCell>
                    <TableCell label="Category">
                      <Badge tone={categoryTone[t.category as keyof typeof categoryTone]}>{t.category}</Badge>
                    </TableCell>
                    <TableCell label="Amount" align="end">
                      <Text tone={t.amount > 0 ? 'positive' : undefined} weight="semibold">
                        {t.amount > 0 ? '+' : ''}
                        {money(t.amount, true)}
                      </Text>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outline">
            <Heading level={2} variant="h5">
              Accounts
            </Heading>
            <List divided>
              {accounts.map((a) => (
                <ListItem
                  key={a.name}
                  start={<Avatar name={a.name} size="sm" shape="square" />}
                  title={a.name}
                  description={a.detail}
                  end={
                    <Text variant="p3" weight="semibold" tone={a.balance < 0 ? 'negative' : undefined}>
                      {money(a.balance, true)}
                    </Text>
                  }
                />
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
