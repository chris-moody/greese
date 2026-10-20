import { useState, type JSX, type ReactNode } from 'react'
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
import { Section } from '../Section.tsx'

/** One labelled demo tile; its contents reveal one after another. */
const Demo = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}): JSX.Element => (
  <Card padding={5} greese={{ inView: 'fadeUp', hover: 'lift' }}>
    <Stack gap={4}>
      <Text variant="p3" weight="semibold" tone="muted" className="site-demo-title">
        {title}
      </Text>
      <Stack gap={3} greese={{ inView: 'rise', stagger: 0.05, delay: 0.1 }}>
        {children}
      </Stack>
    </Stack>
  </Card>
)

const frameworks = ['Astro', 'Next.js', 'Remix', 'Vite', 'React Router', 'TanStack Start']

const Forms = (): JSX.Element => (
  <Grid container minChildWidth="17rem" gap={4}>
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
        greese={{ enter: 'fadeIn' }}
      />
    </Demo>
    <Demo title="Select, combobox, number">
      <Field label="Plan" greese={{ enter: 'fadeIn' }}>
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
      <CheckboxGroup
        label="Notify me"
        defaultValue={['email']}
        greese={{ enter: 'fadeIn' }}
      >
        <Checkbox value="email" label="Email" greese={{ press: 'squish' }} />
        <Checkbox value="sms" label="Text message" greese={{ press: 'squish' }} />
      </CheckboxGroup>
      <RadioGroup label="Billing" defaultValue="yearly" greese={{ enter: 'fadeIn' }}>
        <Radio value="monthly" label="Monthly" greese={{ press: 'squish' }} />
        <Radio
          value="yearly"
          label="Yearly"
          description="Two months free"
          greese={{ press: 'squish' }}
        />
      </RadioGroup>
    </Demo>
    <Demo title="Toggles and ranges">
      <Switch label="Beta features" defaultChecked greese={{ press: 'squish' }} />
      <Slider aria-label="Volume" defaultValue={60} greese={{ focus: 'glow' }} />
      <SegmentedControl
        label="View"
        defaultValue="grid"
        size="sm"
        greese={{ enter: 'fadeIn' }}
      >
        <Segment value="list">List</Segment>
        <Segment value="grid">Grid</Segment>
        <Segment value="board">Board</Segment>
      </SegmentedControl>
    </Demo>
    <Demo title="Ratings and codes">
      <Rating label="Rate greese" defaultValue={4} greese={{ press: 'squish' }} />
      <Field label="Verification code" greese={{ enter: 'fadeIn' }}>
        <OtpField length={4} size="sm" greese={{ focus: 'glow' }} />
      </Field>
    </Demo>
    <Demo title="Dates and colors">
      <DateField
        label="Launch day"
        defaultValue="2026-11-03"
        greese={{ focus: 'glow' }}
      />
      <ColorPicker
        defaultValue="#c2410c"
        aria-label="Brand color"
        greese={{ enter: 'scaleIn' }}
      />
    </Demo>
  </Grid>
)

const Feedback = (): JSX.Element => (
  <Grid container minChildWidth="17rem" gap={4}>
    <Demo title="Alerts">
      <Alert tone="positive" title="Deployed" greese={{ inView: 'fadeStart' }}>
        Version 1.0 is live.
      </Alert>
      <Alert
        tone="warning"
        title="Budget close"
        greese={{ inView: 'fadeStart', delay: 0.1 }}
      >
        A bundle is within 5% of its size budget.
      </Alert>
    </Demo>
    <Demo title="Badges and chips">
      <Stack
        direction="row"
        gap={2}
        wrap="wrap"
        greese={{ inView: 'pop', stagger: 0.05 }}
      >
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
        greese={{ inView: 'fadeIn', stagger: 0.05 }}
      >
        <Chip selectable defaultSelected greese={{ press: 'squish' }}>
          React
        </Chip>
        <Chip selectable greese={{ press: 'squish' }}>
          TypeScript
        </Chip>
        <Chip
          onRemove={() => toast({ title: 'Removed “SCSS”' })}
          greese={{ hover: 'float' }}
        >
          SCSS
        </Chip>
      </Stack>
    </Demo>
    <Demo title="Progress and loading">
      <Progress
        value={64}
        aria-label="Upload"
        className="site-grow"
        greese={{ inView: 'growX' }}
      />
      <Stack direction="row" gap={3} align="center">
        <Spinner label="Loading" greese={{ inView: 'scaleIn' }} />
        <Skeleton lines={2} greese={{ inView: 'fadeIn' }} />
      </Stack>
    </Demo>
    <Demo title="Rings and stats">
      <Stack direction="row" gap={4} align="center" wrap="wrap">
        <RadialProgress
          value={72}
          aria-label="Storage used"
          greese={{ inView: 'scaleIn' }}
        />
        <Stat
          label="Bundle"
          value="Under budget"
          description="every entry, every build"
          tone="positive"
          greese={{ inView: 'fadeStart' }}
        />
      </Stack>
    </Demo>
    <Demo title="People">
      <AvatarGroup max={4} greese={{ inView: 'fadeEnd', stagger: 0.06 }}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
        <Avatar name="Margaret Hamilton" />
        <Avatar name="Radia Perlman" />
      </AvatarGroup>
      <Button
        variant="soft"
        onClick={() => toast({ title: 'Invite sent', tone: 'positive' })}
        greese={{ hover: 'lift', press: 'squish' }}
      >
        Invite (toast)
      </Button>
    </Demo>
  </Grid>
)

const Overlays = (): JSX.Element => (
  <Grid container minChildWidth="17rem" gap={4}>
    <Demo title="Dialog and drawer">
      <Dialog
        trigger={<Button greese={{ hover: 'lift', press: 'squish' }}>Open dialog</Button>}
        title="Pop in, scale out"
        description="A native <dialog>: focus is trapped and returned."
        greese={{ enter: 'pop', exit: 'scaleOut' }}
      >
        <Text>Close it to watch the exit.</Text>
      </Dialog>
      <Drawer
        trigger={
          <Button variant="outline" greese={{ hover: 'lift', press: 'squish' }}>
            Open drawer
          </Button>
        }
        title="A bottom sheet on phones"
        placement={{ xs: 'bottom', md: 'end' }}
        greese={{ enter: 'fadeIn' }}
      >
        <Text>A side panel on desktop. Swipe it away on touch.</Text>
      </Drawer>
    </Demo>
    <Demo title="Menu and popover">
      <Menu
        trigger={
          <Button variant="soft" greese={{ hover: 'lift', press: 'squish' }}>
            Actions
          </Button>
        }
        greese={{ enter: 'scaleIn', exit: 'fadeOutUp' }}
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
            greese={{ hover: 'lift', press: 'squish' }}
          >
            Popover
          </Button>
        }
        label="About anchoring"
        greese={{ enter: 'fadeUp', exit: 'fadeOutDown' }}
      >
        <Text variant="p3">
          The Popover API plus CSS anchor positioning. No positioning library.
        </Text>
      </Popover>
    </Demo>
    <Demo title="Tooltip">
      <Tooltip
        content="Native popover, delayed on hover"
        greese={{ enter: 'fadeUp', exit: 'fadeOut' }}
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
    <Grid container minChildWidth="20rem" gap={4}>
      <Demo title="Table (stacks into cards on phones)">
        <Table
          caption="Contributors"
          hideCaption
          hoverable
          stackBelow="sm"
          greese={{ inView: 'fadeIn' }}
        >
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
          <TableBody greese={{ enter: 'fadeStart', stagger: 0.05 }} key={String(desc)}>
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
          greese={{ inView: 'fadeStart', stagger: 0.06 }}
        >
          <Step>Cart</Step>
          <Step>Shipping</Step>
          <Step>Payment</Step>
          <Step>Done</Step>
        </Steps>
      </Demo>
      <Demo title="Navigation">
        <Breadcrumbs greese={{ inView: 'fadeStart' }}>
          <BreadcrumbItem href="#components">Components</BreadcrumbItem>
          <BreadcrumbItem href="#components">Navigation</BreadcrumbItem>
          <BreadcrumbItem>Breadcrumbs</BreadcrumbItem>
        </Breadcrumbs>
        <Pagination count={12} defaultPage={4} greese={{ inView: 'fadeIn' }} />
      </Demo>
      <Demo title="Disclosure">
        <Accordion exclusive greese={{ inView: 'fadeUp', stagger: 0.05 }}>
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
      <Tabs value={tab} onValueChange={setTab} greese={{ inView: 'fadeUp' }}>
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
        greese={{ inView: 'fadeIn' }}
      >
        Every component, with every prop and state, is in the Storybook docs.
      </Heading>
    </Section>
  )
}
