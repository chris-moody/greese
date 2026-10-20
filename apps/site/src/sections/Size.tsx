import type { JSX } from 'react'
import {
  Code,
  Progress,
  Stack,
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
} from '@greese-ui/react'
import { facts, kB, sizeTables, type Row } from '../data/index.ts'
import { Section } from '../Section.tsx'

const panels: Array<{ value: keyof typeof sizeTables; label: string; caption: string }> =
  [
    {
      value: 'components',
      label: 'Components',
      caption: 'One component, tree-shaken, with what it needs',
    },
    {
      value: 'motion',
      label: 'Motion',
      caption: 'greese.js and the greese prop’s lazy runtime',
    },
    {
      value: 'bundles',
      label: 'Bundles',
      caption: 'The whole library and the stylesheets',
    },
  ]

const SizeTable = ({ rows, caption }: { rows: Row[]; caption: string }): JSX.Element => (
  <Table
    caption={caption}
    hideCaption
    hoverable
    stackBelow="sm"
    greese={{ inView: 'fadeIn' }}
  >
    <TableHead>
      <TableRow>
        <TableHeaderCell>Entry</TableHeaderCell>
        <TableHeaderCell align="end">Size</TableHeaderCell>
        <TableHeaderCell align="end">Budget</TableHeaderCell>
        <TableHeaderCell>Of budget</TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody greese={{ inView: 'fadeStart', stagger: 0.03, distance: '0.75rem' }}>
      {rows.map((r) => (
        <TableRow key={r.label}>
          <TableCell label="Entry">
            <Code>{r.label}</Code>
          </TableCell>
          <TableCell label="Size" align="end">
            {kB(r.size)}
          </TableCell>
          <TableCell label="Budget" align="end">
            {kB(r.limit)}
          </TableCell>
          <TableCell label="Of budget">
            <Progress
              value={r.size}
              max={r.limit}
              size="sm"
              aria-label={`${r.label}: ${Math.round((r.size / r.limit) * 100)}% of its budget`}
              className="site-grow site-budget"
              greese={{ inView: 'growX' }}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

export const Size = (): JSX.Element => (
  <Section
    id="size"
    eyebrow="Size"
    title="Every byte has a budget"
    intro={
      <>
        Measured by size-limit (minified, brotli) on every build. Going over a budget
        fails CI, and budgets only rise on purpose, with the reason written down. Each
        entry includes the shared core it needs, which an app bundles only once however
        many components it uses.
      </>
    }
    tinted
  >
    <Tabs defaultValue="components" greese={{ inView: 'fadeUp' }}>
      <TabList aria-label="Size tables">
        {panels.map((p) => (
          <Tab key={p.value} value={p.value} greese={{ press: 'squish' }}>
            {p.label}
          </Tab>
        ))}
      </TabList>
      {panels.map((p) => (
        <TabPanel key={p.value} value={p.value}>
          <Stack gap={3} className="site-panel">
            <Text tone="muted" size="sm" greese={{ inView: 'fadeIn' }}>
              {p.caption}. Measured {facts.date}.
            </Text>
            <SizeTable rows={sizeTables[p.value]} caption={p.caption} />
          </Stack>
        </TabPanel>
      ))}
    </Tabs>
  </Section>
)
