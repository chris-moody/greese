import type { JSX, ReactNode } from 'react'
import {
  Accordion,
  AccordionItem,
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  Field,
  Grid,
  Heading,
  Menu,
  MenuItem,
  Pagination,
  Popover,
  Progress,
  Radio,
  RadioGroup,
  Segment,
  SegmentedControl,
  Select,
  Skeleton,
  Slider,
  Spinner,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TabList,
  TabPanel,
  Tabs,
  Text,
  TextField,
  Tooltip,
} from '@greese/react'

// No `greese` props here on purpose: what moves is what the theme's
// motion() settings make move.

const Group = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}): JSX.Element => (
  <Card padding={5}>
    <Stack gap={4}>
      <Text size="sm" weight="semibold" tone="muted">
        {title}
      </Text>
      <Stack gap={3}>{children}</Stack>
    </Stack>
  </Card>
)

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const
const WEIGHTS = ['regular', 'medium', 'semibold', 'bold'] as const
const LEADINGS = ['tight', 'snug', 'normal'] as const

/** The typography tokens at work, each sample set by its own variable. */
const Typography = (): JSX.Element => (
  <Group title="Typography">
    <Stack gap={1}>
      <Text size="sm" tone="muted">
        font-body
      </Text>
      <span style={{ fontFamily: 'var(--greese-font-body)', fontSize: '1.25rem' }}>
        The quick brown fox jumps over the lazy dog
      </span>
      <Text size="sm" tone="muted">
        font-mono
      </Text>
      <span style={{ fontFamily: 'var(--greese-font-mono)' }}>
        const theme = createTheme({'{ … }'})
      </span>
    </Stack>
    <Stack gap={1}>
      {SIZES.map((size) => (
        <Stack key={size} direction="row" gap={3} align="baseline">
          <Text size="xs" tone="muted" style={{ inlineSize: '2.5rem', flexShrink: 0 }}>
            {size}
          </Text>
          <span style={{ fontSize: `var(--greese-font-size-${size})` }}>
            Sphinx of quartz
          </span>
        </Stack>
      ))}
    </Stack>
    <Stack direction="row" gap={3} wrap="wrap">
      {WEIGHTS.map((weight) => (
        <span key={weight} style={{ fontWeight: `var(--greese-font-weight-${weight})` }}>
          {weight}
        </span>
      ))}
    </Stack>
    <Stack direction="row" gap={4}>
      {LEADINGS.map((leading) => (
        <Stack key={leading} gap={1} style={{ flex: 1, minInlineSize: 0 }}>
          <Text size="xs" tone="muted">
            {leading}
          </Text>
          <span
            style={{
              lineHeight: `var(--greese-line-height-${leading})`,
              fontSize: '0.875rem',
            }}
          >
            Pack my box with five dozen liquor jugs.
          </span>
        </Stack>
      ))}
    </Stack>
  </Group>
)

const people = [
  { name: 'Ada Lovelace', role: 'Analyst', commits: 128 },
  { name: 'Grace Hopper', role: 'Compiler', commits: 342 },
  { name: 'Alan Turing', role: 'Theory', commits: 96 },
]

export const Gallery = (): JSX.Element => (
  <Stack gap={5}>
    <Stack gap={2}>
      <Heading level={1} size="2xl">
        Theme preview
      </Heading>
      <Text tone="muted">
        Every component here uses your theme. Turn on Inspect to pick one.
      </Text>
    </Stack>
    <Grid container minChildWidth="17rem" gap={4}>
      <Typography />
      <Group title="Buttons">
        <Stack direction="row" gap={2} wrap="wrap">
          <Button>Solid</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="text">Text</Button>
        </Stack>
        <Stack direction="row" gap={2} wrap="wrap">
          <Button tone="neutral" size="sm">
            Neutral
          </Button>
          <Button tone="negative" variant="soft" size="sm">
            Delete
          </Button>
          <Button loading size="sm">
            Saving
          </Button>
        </Stack>
      </Group>
      <Group title="Text fields">
        <TextField label="Email" type="email" placeholder="you@example.com" />
        <TextField
          label="Username"
          defaultValue="grease monkey"
          error="No spaces, please"
        />
      </Group>
      <Group title="Choices">
        <Field label="Plan">
          <Select defaultValue="pro">
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </Select>
        </Field>
        <Checkbox label="Email me" defaultChecked />
        <RadioGroup label="Billing" defaultValue="yearly">
          <Radio value="monthly" label="Monthly" />
          <Radio value="yearly" label="Yearly" />
        </RadioGroup>
      </Group>
      <Group title="Toggles and ranges">
        <Switch label="Beta features" defaultChecked />
        <Slider aria-label="Volume" defaultValue={60} />
        <SegmentedControl label="View" defaultValue="grid" size="sm">
          <Segment value="list">List</Segment>
          <Segment value="grid">Grid</Segment>
          <Segment value="board">Board</Segment>
        </SegmentedControl>
      </Group>
      <Group title="Feedback">
        <Alert tone="positive" title="Deployed">
          Version 1.0 is live.
        </Alert>
        <Alert tone="warning" title="Budget close">
          A bundle is within 5% of its budget.
        </Alert>
        <Progress value={64} aria-label="Upload" />
        <Stack direction="row" gap={3} align="center">
          <Spinner label="Loading" />
          <Skeleton lines={2} />
        </Stack>
      </Group>
      <Group title="Badges, chips, people">
        <Stack direction="row" gap={2} wrap="wrap">
          <Badge tone="accent">New</Badge>
          <Badge tone="positive" variant="solid">
            Passing
          </Badge>
          <Badge tone="info" variant="outline">
            Beta
          </Badge>
        </Stack>
        <Stack direction="row" gap={2} wrap="wrap">
          <Chip selectable defaultSelected>
            React
          </Chip>
          <Chip selectable>TypeScript</Chip>
        </Stack>
        <AvatarGroup max={4}>
          <Avatar name="Ada Lovelace" />
          <Avatar name="Grace Hopper" />
          <Avatar name="Katherine Johnson" />
          <Avatar name="Margaret Hamilton" />
          <Avatar name="Radia Perlman" />
        </AvatarGroup>
      </Group>
      <Group title="Overlays">
        <Stack direction="row" gap={2} wrap="wrap">
          <Dialog
            trigger={<Button>Dialog</Button>}
            title="A native dialog"
            description="Close it to see the exit."
          >
            <Text>Focus is trapped and returned.</Text>
          </Dialog>
          <Menu trigger={<Button variant="soft">Menu</Button>}>
            <MenuItem>Duplicate</MenuItem>
            <MenuItem tone="negative">Delete</MenuItem>
          </Menu>
          <Popover trigger={<Button variant="outline">Popover</Button>} label="About">
            <Text size="sm">Anchored with CSS.</Text>
          </Popover>
          <Tooltip content="A native popover">
            <Button variant="ghost">Tooltip</Button>
          </Tooltip>
        </Stack>
      </Group>
      <Group title="Navigation">
        <Breadcrumbs>
          <BreadcrumbItem href="#">Components</BreadcrumbItem>
          <BreadcrumbItem href="#">Navigation</BreadcrumbItem>
          <BreadcrumbItem>Breadcrumbs</BreadcrumbItem>
        </Breadcrumbs>
        <Pagination count={12} defaultPage={4} />
        <Tabs defaultValue="one">
          <TabList aria-label="Sections">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
          <TabPanel value="one">
            <Text size="sm">The first panel.</Text>
          </TabPanel>
          <TabPanel value="two">
            <Text size="sm">The second panel.</Text>
          </TabPanel>
        </Tabs>
      </Group>
      <Group title="Data and disclosure">
        <Table caption="Contributors" hideCaption hoverable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell align="end">Commits</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {people.map((p) => (
              <TableRow key={p.name}>
                <TableCell>{p.name}</TableCell>
                <TableCell align="end">{p.commits}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Accordion exclusive>
          <AccordionItem title="Native <details>" defaultOpen>
            <Text size="sm">Opens with no JavaScript.</Text>
          </AccordionItem>
          <AccordionItem title="Exclusive">
            <Text size="sm">One open at a time.</Text>
          </AccordionItem>
        </Accordion>
      </Group>
    </Grid>
  </Stack>
)
