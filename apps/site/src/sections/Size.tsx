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
  VisuallyHidden,
} from '@greese/react'
import { facts, kB, sizeTables, type Row } from '../data/index.ts'
import { Section } from '../Section.tsx'

const panels: Array<{ value: keyof typeof sizeTables; label: string; caption: string }> =
  [
    {
      value: 'bundles',
      label: 'Bundles',
      caption: 'The whole library and the stylesheets',
    },
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
  ]

const SizeTable = ({ rows, caption }: { rows: Row[]; caption: string }): JSX.Element => {
  // Bars are relative to one another: the largest entry fills the track.
  const sorted = [...rows].sort((a, b) => b.size - a.size)
  const largest = sorted[0]?.size ?? 1
  return (
    <Table
      caption={caption}
      hideCaption
      hoverable
      stackBelow="sm"
      greese={{ inView: 'theme' }}
    >
      <TableHead>
        <TableRow>
          <TableHeaderCell>Entry</TableHeaderCell>
          <TableHeaderCell align="end">Size</TableHeaderCell>
          <TableHeaderCell>
            <VisuallyHidden>Size relative to the largest</VisuallyHidden>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody greese={{ inView: 'theme', stagger: 0.03, distance: '0.75rem' }}>
        {sorted.map((r) => (
          <TableRow key={r.label}>
            <TableCell label="Entry">
              <Code>{r.label}</Code>
            </TableCell>
            <TableCell label="Size" align="end">
              {kB(r.size)}
            </TableCell>
            <TableCell label="Relative">
              <Progress
                value={r.size}
                max={largest}
                size="sm"
                aria-label={`${r.label}: ${Math.round((r.size / largest) * 100)}% of the largest`}
                className="site-grow site-budget"
                greese={{ inView: 'growX' }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export const Size = (): JSX.Element => (
  <Section
    id="size"
    eyebrow="Size"
    title="Every byte is measured"
    intro={
      <>
        Measured minified + brotli sizes. Each entry includes the
        shared core it needs, which an app bundles only once.
      </>
    }
    tinted
  >
    <Tabs defaultValue="bundles" greese={{ inView: 'theme' }}>
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
            <Text tone="muted" variant="p3" greese={{ inView: 'theme' }}>
              {p.caption}. Measured {facts.date}.
            </Text>
            <SizeTable rows={sizeTables[p.value]} caption={p.caption} />
          </Stack>
        </TabPanel>
      ))}
    </Tabs>
  </Section>
)
