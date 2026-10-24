/**
 * Admin dashboard: an app shell with a sidebar (off-canvas on phones), a
 * toolbar with search and notifications, KPI stats, sales by channel, service
 * status, and an orders table with status tabs and pagination.
 */
import { useState, type JSX } from 'react'
import {
  AppBar,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  Grid,
  Heading,
  IconButton,
  Indicator,
  Pagination,
  Progress,
  Sidebar,
  SidebarLayout,
  SidebarTrigger,
  Spacer,
  Stack,
  Stat,
  StatGroup,
  Status,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TabList,
  Tabs,
  Text,
  TextField,
} from '@greese/react'
import {
  BellIcon,
  CartIcon,
  DocumentIcon,
  HomeIcon,
  LayersIcon,
  SearchIcon,
  SlidersIcon,
  UserIcon,
} from '@greese/icons'

const nav = [
  { label: 'Overview', icon: <HomeIcon /> },
  { label: 'Orders', icon: <CartIcon /> },
  { label: 'Customers', icon: <UserIcon /> },
  { label: 'Products', icon: <LayersIcon /> },
  { label: 'Reports', icon: <DocumentIcon /> },
  { label: 'Settings', icon: <SlidersIcon /> },
]

const channels = [
  { name: 'Online store', share: 58 },
  { name: 'Marketplace', share: 24 },
  { name: 'Retail', share: 12 },
  { name: 'Wholesale', share: 6 },
]

const services = [
  { name: 'Storefront', tone: 'positive', state: 'Operational' },
  { name: 'Payments', tone: 'positive', state: 'Operational' },
  { name: 'Search index', tone: 'warning', state: 'Degraded' },
  { name: 'Email delivery', tone: 'positive', state: 'Operational' },
] as const

type OrderState = 'Paid' | 'Pending' | 'Shipped' | 'Refunded'
const orders: Array<{
  id: string
  customer: string
  items: number
  total: number
  state: OrderState
}> = [
  { id: '#10482', customer: 'Maya Chen', items: 3, total: 142.8, state: 'Paid' },
  { id: '#10481', customer: 'Jonas Weber', items: 1, total: 39, state: 'Pending' },
  { id: '#10480', customer: 'Aiyana Brooks', items: 5, total: 318.45, state: 'Shipped' },
  { id: '#10479', customer: 'Tomás Ruiz', items: 2, total: 76.2, state: 'Shipped' },
  { id: '#10478', customer: 'Priya Natarajan', items: 1, total: 54, state: 'Refunded' },
  { id: '#10477', customer: 'Lena Novak', items: 4, total: 201.9, state: 'Pending' },
]

const stateTone = {
  Paid: 'primary',
  Pending: 'warning',
  Shipped: 'positive',
  Refunded: 'neutral',
} as const

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export const Admin = (): JSX.Element => {
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [current, setCurrent] = useState('Overview')
  const shown = orders.filter((o) => tab === 'all' || o.state.toLowerCase() === tab)

  return (
    <SidebarLayout breakpoint="md" className="tpl-shell">
      <Sidebar label="Admin navigation">
        <Stack gap={1} p={3}>
          <Text weight="bold" className="tpl-brand">
            Northwind Admin
          </Text>
          {nav.map((item) => (
            <Button
              key={item.label}
              variant={current === item.label ? 'soft' : 'ghost'}
              tone={current === item.label ? 'primary' : 'neutral'}
              startIcon={item.icon}
              className="tpl-nav-button"
              aria-current={current === item.label ? 'page' : undefined}
              onClick={() => setCurrent(item.label)}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Sidebar>

      <div className="tpl-main">
        <AppBar>
          <Stack direction="row" align="center" gap={2} px={4} py={2}>
            <SidebarTrigger />
            <TextField
              label="Search"
              hideLabel
              size="sm"
              type="search"
              placeholder="Search orders, customers…"
              startAdornment={<SearchIcon />}
            />
            <Spacer />
            <Indicator
              content={
                <Badge tone="negative" variant="solid">
                  3
                </Badge>
              }
            >
              <IconButton label="Notifications, 3 unread" size="sm">
                <BellIcon />
              </IconButton>
            </Indicator>
            <Avatar name="Sam Okafor" size="sm" />
          </Stack>
        </AppBar>

        <Stack gap={5} p={{ xs: 4, md: 5 }} greese={{ enter: 'theme', stagger: 0.06 }}>
          <Stack direction="row" justify="between" align="end" gap={3} wrap="wrap">
            <Heading level={1} variant="h3">
              {current}
            </Heading>
            <AvatarGroup max={3} size="sm">
              <Avatar name="Sam Okafor" />
              <Avatar name="Rina Patel" />
              <Avatar name="Luis Ortega" />
              <Avatar name="Ada Kim" />
              <Avatar name="Ben Fox" />
            </AvatarGroup>
          </Stack>

          <Card variant="outline">
            <StatGroup>
              <Stat
                label="Revenue"
                value="$48,210"
                description="up 12% on last week"
                tone="positive"
              />
              <Stat label="Orders" value="1,204" description="up 3%" tone="positive" />
              <Stat label="New customers" value="312" description="flat" tone="muted" />
              <Stat
                label="Refund rate"
                value="1.8%"
                description="up 0.4 points"
                tone="negative"
              />
            </StatGroup>
          </Card>

          <Grid container columns={12} gap={4}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card variant="outline">
                <Heading level={2} variant="h5">
                  Sales by channel
                </Heading>
                <Stack gap={4}>
                  {channels.map((c) => (
                    <Stack key={c.name} gap={1}>
                      <Stack direction="row" justify="between">
                        <Text variant="p3">{c.name}</Text>
                        <Text variant="p3" weight="semibold">
                          {c.share}%
                        </Text>
                      </Stack>
                      <Progress
                        value={c.share}
                        size="sm"
                        aria-label={`${c.name}: ${c.share}%`}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Card variant="outline">
                <Heading level={2} variant="h5">
                  Services
                </Heading>
                <Stack gap={3}>
                  {services.map((s) => (
                    <Stack key={s.name} direction="row" justify="between" align="center">
                      <Text variant="p3">{s.name}</Text>
                      <Status
                        tone={s.tone}
                        label={s.state}
                        pulse={s.tone !== 'positive'}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>

          <Card variant="outline">
            <Stack direction="row" justify="between" align="center" gap={3} wrap="wrap">
              <Heading level={2} variant="h5">
                Orders
              </Heading>
              <Button size="sm" variant="soft" tone="neutral">
                Export CSV
              </Button>
            </Stack>
            <Tabs value={tab} onValueChange={setTab}>
              <TabList aria-label="Order status">
                <Tab value="all">All</Tab>
                <Tab value="pending">Pending</Tab>
                <Tab value="shipped">Shipped</Tab>
                <Tab value="refunded">Refunded</Tab>
              </TabList>
            </Tabs>
            <Table caption="Orders" hideCaption stackBelow="sm" hoverable>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Order</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell align="end">Items</TableHeaderCell>
                  <TableHeaderCell align="end">Total</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shown.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell label="Order">
                      <Text weight="semibold">{o.id}</Text>
                    </TableCell>
                    <TableCell label="Customer">{o.customer}</TableCell>
                    <TableCell label="Items" align="end">
                      {o.items}
                    </TableCell>
                    <TableCell label="Total" align="end">
                      {money(o.total)}
                    </TableCell>
                    <TableCell label="Status">
                      <Badge tone={stateTone[o.state]}>{o.state}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              count={8}
              page={page}
              onPageChange={setPage}
              label="Orders pages"
            />
          </Card>
        </Stack>
      </div>
    </SidebarLayout>
  )
}
