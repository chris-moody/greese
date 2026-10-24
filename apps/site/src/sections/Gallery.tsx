import { Children, useState, type JSX, type ReactNode } from 'react'
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
  CheckboxGroup,
  Chip,
  ColorPicker,
  Combobox,
  DateField,
  Dialog,
  Drawer,
  Field,
  Grid,
  Heading,
  Menu,
  Motion,
  MenuItem,
  MenuSeparator,
  NumberField,
  OtpField,
  Pagination,
  Popover,
  Progress,
  RadialProgress,
  Radio,
  RadioGroup,
  Rating,
  Segment,
  SegmentedControl,
  Select,
  Skeleton,
  Slider,
  Spinner,
  Stat,
  Step,
  Steps,
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
  toast,
  Tooltip,
} from '@greese/react'
import { facts, kB } from '../data/index.ts'
import { Section } from '../Section.tsx'
import { useCountUp } from '../useCountUp.ts'

/**
 * One labelled demo tile. The tile is a scope: its title and each piece of
 * its content enter one after another, and the tile itself takes one place
 * in the grid's scope, so the whole tab plays as a single sequence.
 */
const Demo = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}): JSX.Element => (
  <Card
    padding={5}
    greese={{
      enter: 'theme',
      hover: 'rise',
      scope: { stagger: 0.05, delay: 0.05 },
    }}
  >
    <Stack gap={4}>
      <Text
        variant="p3"
        weight="semibold"
        tone="muted"
        className="site-demo-title"
        greese={{ enter: 'theme' }}
      >
        {title}
      </Text>
      <Stack gap={3}>
        {Children.toArray(children).map((child, i) => (
          <Motion key={i} greese={{ enter: 'theme' }}>
            {child}
          </Motion>
        ))}
      </Stack>
    </Stack>
  </Card>
)

const frameworks = ['Astro', 'Next.js', 'Remix', 'Vite', 'React Router', 'TanStack Start']

const Forms = (): JSX.Element => (
  <Grid
    container
    minChildWidth="17rem"
    gap={4}
    greese={{ scope: { stagger: 0.07, inView: true } }}
  >
    <Demo title="Text fields">
      <TextField
        label="Email"
        type="email"
        placeholder="you@example.com"
        greese={{ focus: 'glow' }}
      />
      <TextField
        label="Username"
        defaultValue="grease monkey"
        error="Usernames can’t contain spaces"
      />
    </Demo>
    <Demo title="Select, combobox, number">
      <Field label="Plan">
        <Select defaultValue="pro" greese={{ focus: 'glow' }}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="team">Team</option>
        </Select>
      </Field>
      <Combobox
        label="Framework"
        options={frameworks}
        placeholder="Search…"
        greese={{ focus: 'glow' }}
      />
      <NumberField
        label="Seats"
        defaultValue={5}
        min={1}
        max={50}
        greese={{ focus: 'glow' }}
      />
    </Demo>
    <Demo title="Choices">
      <CheckboxGroup label="Notify me" defaultValue={['email']}>
        <Checkbox value="email" label="Email" />
        <Checkbox value="sms" label="Text message" />
      </CheckboxGroup>
      <RadioGroup label="Billing" defaultValue="yearly">
        <Radio value="monthly" label="Monthly" />
        <Radio
          value="yearly"
          label="Yearly"
          description="Two months free"
        />
      </RadioGroup>
    </Demo>
    <Demo title="Toggles and ranges">
      <Switch label="Beta features" defaultChecked />
      <Slider aria-label="Volume" defaultValue={60} greese={{ focus: 'glow' }} />
      <SegmentedControl label="View" defaultValue="grid" size="sm">
        <Segment value="list">List</Segment>
        <Segment value="grid">Grid</Segment>
        <Segment value="board">Board</Segment>
      </SegmentedControl>
    </Demo>
    <Demo title="Ratings and codes">
      <Rating label="Rate greese" defaultValue={4} />
      <Field label="Verification code">
        <OtpField length={4} size="sm" greese={{ focus: 'glow' }} />
      </Field>
    </Demo>
    <Demo title="Dates and colors">
      <DateField
        label="Launch day"
        defaultValue="2026-11-03"
        greese={{ focus: 'glow' }}
      />
      <ColorPicker defaultValue="#c2410c" aria-label="Brand color" />
    </Demo>
  </Grid>
)

/** A ring and a stat that count up to their values when they scroll into view. */
const Counters = (): JSX.Element => {
  const [ref, n] = useCountUp<HTMLDivElement>(72)
  const [statRef, bytes] = useCountUp<HTMLDivElement>(facts.library.size)
  return (
    <Stack direction="row" gap={4} align="center" wrap="wrap">
      <RadialProgress
        ref={ref}
        className="site-ring"
        value={n}
        aria-label="Storage used"
        aria-valuetext="72%"
      >
        {Math.round(n)}%
      </RadialProgress>
      <div ref={statRef}>
        <Stat
          label="Whole library"
          value={kB(Math.round(bytes))}
          description="brotli, and it tree-shakes"
          tone="positive"
        />
      </div>
    </Stack>
  )
}

const Feedback = (): JSX.Element => (
  <Grid
    container
    minChildWidth="17rem"
    gap={4}
    greese={{ scope: { stagger: 0.07, inView: true } }}
  >
    <Demo title="Alerts">
      <Alert tone="positive" title="Deployed">
        Version 1.0 is live.
      </Alert>
      <Alert
        tone="warning"
        title="Budget close"
        greese={{ inView: 'theme', delay: 0.1 }}
      >
        A bundle is within 5% of its size budget.
      </Alert>
    </Demo>
    <Demo title="Badges and chips">
      <Stack direction="row" gap={2} wrap="wrap" greese={{ enter: 'pop', stagger: 0.05 }}>
        <Badge tone="primary">New</Badge>
        <Badge tone="positive" variant="solid">
          Passing
        </Badge>
        <Badge tone="info" variant="outline">
          Beta
        </Badge>
      </Stack>
      <Stack
        direction="row"
        gap={2}
        wrap="wrap"
        greese={{ enter: 'theme', stagger: 0.05 }}
      >
        <Chip selectable defaultSelected greese={{ press: 'squish' }}>
          React
        </Chip>
        <Chip selectable greese={{ press: 'squish' }}>
          TypeScript
        </Chip>
        <Chip
          onRemove={() => toast({ title: 'Removed “SCSS”' })}
          greese={{ hover: 'rise' }}
        >
          SCSS
        </Chip>
      </Stack>
    </Demo>
    <Demo title="Progress and loading">
      <Progress value={64} aria-label="Upload" className="site-grow" />
      <Stack direction="row" gap={3} align="center">
        <Spinner label="Loading" />
        <Skeleton lines={2} />
      </Stack>
    </Demo>
    <Demo title="Rings and stats">
      <Counters />
    </Demo>
    <Demo title="People">
      <AvatarGroup max={4} greese={{ enter: 'theme', stagger: 0.06 }}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
        <Avatar name="Margaret Hamilton" />
        <Avatar name="Radia Perlman" />
      </AvatarGroup>
      <Button
        variant="soft"
        onClick={() => toast({ title: 'Invite sent', tone: 'positive' })}
        greese={{ hover: 'rise', press: 'squish' }}
      >
        Invite (toast)
      </Button>
    </Demo>
  </Grid>
)

const Overlays = (): JSX.Element => (
  <Grid
    container
    minChildWidth="17rem"
    gap={4}
    greese={{ scope: { stagger: 0.07, inView: true } }}
  >
    <Demo title="Dialog and drawer">
      <Dialog
        trigger={<Button greese={{ hover: 'rise', press: 'squish' }}>Open dialog</Button>}
        title="The theme’s entrance and exit"
        description="A native <dialog>: focus is trapped and returned."
      >
        <Text>Close it to watch the exit. Pick a motion theme to change both.</Text>
      </Dialog>
      <Drawer
        trigger={
          <Button variant="outline" greese={{ hover: 'rise', press: 'squish' }}>
            Open drawer
          </Button>
        }
        title="A bottom sheet on phones"
        placement={{ xs: 'bottom', md: 'end' }}
      >
        <Text>A side panel on desktop. Swipe it away on touch.</Text>
      </Drawer>
    </Demo>
    <Demo title="Menu and popover">
      <Menu
        trigger={
          <Button variant="soft" greese={{ hover: 'rise', press: 'squish' }}>
            Actions
          </Button>
        }
      >
        <MenuItem onSelect={() => toast({ title: 'Duplicated' })}>Duplicate</MenuItem>
        <MenuItem onSelect={() => toast({ title: 'Shared' })}>Share</MenuItem>
        <MenuSeparator />
        <MenuItem
          tone="negative"
          onSelect={() => toast({ title: 'Deleted', tone: 'negative' })}
        >
          Delete
        </MenuItem>
      </Menu>
      <Popover
        trigger={
          <Button
            variant="outline"
            tone="neutral"
            greese={{ hover: 'rise', press: 'squish' }}
          >
            Popover
          </Button>
        }
        label="About anchoring"
      >
        <Text variant="p3">
          The Popover API plus CSS anchor positioning. No positioning library.
        </Text>
      </Popover>
    </Demo>
    <Demo title="Tooltip">
      <Tooltip
        content="Native popover, delayed on hover"
      >
        <Button variant="ghost" greese={{ hover: 'tilt' }}>
          Hover or focus me
        </Button>
      </Tooltip>
    </Demo>
  </Grid>
)

const people = [
  { name: 'Ada Lovelace', role: 'Analyst', commits: 128 },
  { name: 'Grace Hopper', role: 'Compiler', commits: 342 },
  { name: 'Alan Turing', role: 'Theory', commits: 96 },
]

const Data = (): JSX.Element => {
  const [desc, setDesc] = useState(true)
  const rows = [...people].sort((a, b) =>
    desc ? b.commits - a.commits : a.commits - b.commits
  )
  return (
    <Grid
      container
      minChildWidth="20rem"
      gap={4}
      greese={{ scope: { stagger: 0.07, inView: true } }}
    >
      <Demo title="Table (stacks into cards on phones)">
        <Table caption="Contributors" hideCaption hoverable stackBelow="sm">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell
                align="end"
                sort={desc ? 'descending' : 'ascending'}
                onSort={() => setDesc((d) => !d)}
              >
                Commits
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody greese={{ enter: 'theme', stagger: 0.05 }} key={String(desc)}>
            {rows.map((p) => (
              <TableRow key={p.name}>
                <TableCell label="Name">{p.name}</TableCell>
                <TableCell label="Role">{p.role}</TableCell>
                <TableCell label="Commits" align="end">
                  {p.commits}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Demo>
      <Demo title="Steps">
        <Steps
          current={1}
          aria-label="Checkout"
          greese={{ enter: 'theme', stagger: 0.06 }}
        >
          <Step>Cart</Step>
          <Step>Shipping</Step>
          <Step>Payment</Step>
          <Step>Done</Step>
        </Steps>
      </Demo>
      <Demo title="Navigation">
        <Breadcrumbs>
          <BreadcrumbItem href="#components">Components</BreadcrumbItem>
          <BreadcrumbItem href="#components">Navigation</BreadcrumbItem>
          <BreadcrumbItem>Breadcrumbs</BreadcrumbItem>
        </Breadcrumbs>
        <Pagination count={12} defaultPage={4} />
      </Demo>
      <Demo title="Disclosure">
        <Accordion exclusive greese={{ enter: 'theme', stagger: 0.05 }}>
          <AccordionItem title="Native <details>" defaultOpen>
            <Text variant="p3">Opens and closes with no JavaScript.</Text>
          </AccordionItem>
          <AccordionItem title="Exclusive">
            <Text variant="p3">One open at a time, by the platform.</Text>
          </AccordionItem>
        </Accordion>
      </Demo>
    </Grid>
  )
}

const tabs = [
  { value: 'forms', label: 'Forms', panel: <Forms /> },
  { value: 'feedback', label: 'Feedback', panel: <Feedback /> },
  { value: 'overlays', label: 'Overlays', panel: <Overlays /> },
  { value: 'data', label: 'Data and navigation', panel: <Data /> },
]

export const Gallery = (): JSX.Element => {
  // Controlled, so only the open group's components are rendered: the
  // others would cost render time for content nobody sees yet.
  const [tab, setTab] = useState('forms')
  return (
    <Section
      id="components"
      eyebrow="Components"
      title="Real components, animated"
      intro="Everything below is GreeseUI itself, each with a greese prop. Use them: they work."
      tinted
    >
      <Tabs value={tab} onValueChange={setTab} greese={{ inView: 'theme' }}>
        <TabList aria-label="Component groups">
          {tabs.map((t) => (
            <Tab key={t.value} value={t.value} greese={{ press: 'squish' }}>
              {t.label}
            </Tab>
          ))}
        </TabList>
        {tabs.map((t) => (
          <TabPanel key={t.value} value={t.value}>
            {t.value === tab && <div className="site-panel">{t.panel}</div>}
          </TabPanel>
        ))}
      </Tabs>
      <Heading
        level={3}
        variant="h6"
        tone="muted"
        className="site-gallery-note"
        greese={{ inView: 'theme' }}
      >
        Every component, with every prop and state, is in the Storybook docs.
      </Heading>
    </Section>
  )
}
