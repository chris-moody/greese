import { useState, type JSX, type ReactNode } from 'react'
import {
  Accordion,
  AutoLayout,
  AutoLayoutItem,
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
  Heading,
  Menu,
  MenuItem,
  PageTransition,
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
  usePageNavigate,
  type Responsive,
} from '@greese/react'

// No `greese` props here on purpose: what moves is what the theme's
// motion() settings make move.

/** Columns a tile takes: the whole row on narrow screens, then two or three to a row. */
const TILE = { xs: 12, md: 6, lg: 4 } as const
const SOLO = { xs: 12 } as const

const Group = ({
  title,
  children,
  size = TILE,
}: {
  title: string
  children: ReactNode
  size?: Responsive<number>
}): JSX.Element => (
  <AutoLayoutItem size={size}>
    <Card padding={5} style={{ blockSize: '100%' }}>
      <Stack gap={4}>
        <Text variant="h3" weight="semibold" tone="muted">
          {title}
        </Text>
        <Stack gap={3}>{children}</Stack>
      </Stack>
    </Card>
  </AutoLayoutItem>
)

const WEIGHTS = ['regular', 'medium', 'semibold', 'bold'] as const
const LEADINGS = ['tight', 'snug', 'normal'] as const

/** The font, weight and line-height tokens at work, each sample set by its own variable. (Sizes belong to the type variants, in the next tile.) */
const Typography = (): JSX.Element => (
  <Group title="Typography" size={TILE}>
    <Stack gap={1}>
      <Text variant="p3" tone="muted">
        font-body
      </Text>
      <span style={{ fontFamily: 'var(--greese-font-body)', fontSize: '1.25rem' }}>
        The quick brown fox jumps over the lazy dog
      </span>
      <Text variant="p3" tone="muted">
        font-mono
      </Text>
      <span style={{ fontFamily: 'var(--greese-font-mono)' }}>
        const theme = createTheme({'{ … }'})
      </span>
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
          <Text variant="caption" tone="muted">
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

const VARIANTS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  's1',
  's2',
  'p1',
  'p2',
  'p3',
  'caption',
] as const

/** The type variants as they set themselves: resize the preview to watch them change. */
const TypeVariants = (): JSX.Element => (
  <Group title="Type variants" size={SOLO}>
    <Stack gap={2}>
      {VARIANTS.map((variant) => (
        <Stack key={variant} direction="row" gap={3} align="baseline">
          <Text
            variant="caption"
            tone="muted"
            style={{ inlineSize: '3.5rem', flexShrink: 0 }}
          >
            {variant}
          </Text>
          <Text variant={variant} style={{ minInlineSize: 0 }}>
            {variant === 'caption' ? 'Small print' : 'The quick brown fox'}
          </Text>
        </Stack>
      ))}
      <Button variant="soft" size="sm" style={{ alignSelf: 'start' }}>
        Button variant
      </Button>
    </Stack>
  </Group>
)

/**
 * A scope: the parent orders the entrances inside it, at any depth. Each
 * piece names only its own entrance, so the theme's motion settings (duration,
 * ease, distance, set under Motion) tune every one of them. Use "Replay motion".
 */
const ScopeTile = (): JSX.Element => (
  <Group title="Motion scope">
    <Stack gap={2} greese={{ scope: { stagger: 0.12, delay: 0.1 } }}>
      <Text variant="h6" greese={{ enter: 'fadeUp' }}>
        One parent, one sequence
      </Text>
      <Text variant="p3" tone="muted" greese={{ enter: 'fadeUp' }}>
        Each piece declares its own entrance; the scope sets when it starts.
      </Text>
      <Stack direction="row" gap={2} greese={{ scope: { stagger: 0.06 } }}>
        {['One', 'Two', 'Three'].map((n) => (
          <Card key={n} padding={3} greese={{ enter: 'scaleIn' }}>
            <Text variant="caption" greese={{ enter: 'fadeIn' }}>
              {n}
            </Text>
          </Card>
        ))}
      </Stack>
      <Button size="sm" greese={{ enter: 'pop' }} style={{ alignSelf: 'start' }}>
        Continue
      </Button>
    </Stack>
  </Group>
)

const PAGES = [
  { title: 'Overview', body: 'Where you start: the page that leaves.' },
  { title: 'Details', body: 'One step deeper: the page that arrives.' },
] as const

/**
 * Two pages and a page change between them, played as the theme says
 * (Pages, under Motion): its page roles, forward and back, and its rules for
 * parts of a page. The pages share a URL, so each change names its own
 * direction.
 */
const PageTile = (): JSX.Element => {
  const [at, setAt] = useState(0)
  const page = usePageNavigate((to) => {
    if (typeof to === 'string') setAt(Number(to.slice(1)))
  })
  const go = (to: number) =>
    page.navigate(`#${to}`, {
      types: ['greese-page', to < at ? 'greese-back' : 'greese-forward'],
    })
  const current = PAGES[at]!
  return (
    <Group title="Page transition">
      <PageTransition>
        <Card padding={4} variant="outline">
          <Stack gap={2}>
            <Text variant="h6">{current.title}</Text>
            <Text variant="p3" tone="muted">
              {current.body}
            </Text>
          </Stack>
        </Card>
      </PageTransition>
      <Stack direction="row" gap={2}>
        <Button size="sm" variant="soft" disabled={at === 0} onClick={() => go(0)}>
          Back
        </Button>
        <Button size="sm" disabled={at === 1} onClick={() => go(1)}>
          Next
        </Button>
      </Stack>
    </Group>
  )
}

const people = [
  { name: 'Ada Lovelace', role: 'Analyst', commits: 128 },
  { name: 'Grace Hopper', role: 'Compiler', commits: 342 },
  { name: 'Alan Turing', role: 'Theory', commits: 96 },
]

export const Gallery = (): JSX.Element => (
  <Stack gap={5}>
    <Stack gap={2}>
      <Heading level={1} variant="h3">
        Theme preview
      </Heading>
      <Text tone="muted">
        Every component here uses your theme. Turn on Inspect to pick one.
      </Text>
    </Stack>
    <AutoLayout gap={4}>
      <TypeVariants />
      <Typography />
      <ScopeTile />
      <PageTile />
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
            <Text variant="p3">Anchored with CSS.</Text>
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
            <Text variant="p3">The first panel.</Text>
          </TabPanel>
          <TabPanel value="two">
            <Text variant="p3">The second panel.</Text>
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
            <Text variant="p3">Opens with no JavaScript.</Text>
          </AccordionItem>
          <AccordionItem title="Exclusive">
            <Text variant="p3">One open at a time.</Text>
          </AccordionItem>
        </Accordion>
      </Group>
    </AutoLayout>
  </Stack>
)
