import { useState, type CSSProperties, type JSX } from 'react'
import {
  Badge,
  Card,
  Code,
  Grid,
  Motion,
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
  Tooltip,
} from '@greese/react'
import {
  benchmark,
  byWin,
  fmt,
  mainThread,
  outcome,
  ratio,
  scorecard,
  type Metric,
  type Setup,
} from '../data/index.ts'
import { Section } from '../Section.tsx'

const SETUPS: Record<Setup, { label: string; legend: string }> = {
  greese: { label: 'Whole stylesheet', legend: 'GreeseUI (whole stylesheet)' },
  greeseCss: { label: 'Per-component CSS', legend: 'GreeseUI (per-component CSS)' },
}

const verdict = (m: Metric, setup: Setup) => {
  const r = ratio(m, setup)
  switch (outcome(m, setup)) {
    case 'win':
      return { tone: 'positive' as const, text: `GreeseUI ${r.toFixed(1)}× lower` }
    case 'loss':
      return { tone: 'warning' as const, text: `MUI ${(1 / r).toFixed(1)}× lower` }
    default:
      return { tone: 'neutral' as const, text: 'About even' }
  }
}

const Bar = ({
  lib,
  value,
  max,
  unit,
}: {
  lib: 'greese' | 'mui'
  value: number
  max: number
  unit: string
}) => (
  <div className="site-bar-row">
    {/* Motion gives the bar the prop, so it grows while its label stays still. */}
    <Motion asChild greese={{ inView: 'growX' }}>
      <span
        className={`site-bar site-bar--${lib} site-grow`}
        style={{ '--site-bar': `${(value / max) * 100}%` } as CSSProperties}
      />
    </Motion>
    <Text variant="p3" className="site-bar-value">
      {fmt(value, unit)}
    </Text>
  </div>
)

const Chart = ({ setup }: { setup: Setup }): JSX.Element => (
  <Stack gap={4}>
    <Stack direction="row" gap={4} wrap="wrap" aria-hidden="true" className="site-legend">
      <span className="site-key site-key--greese">{SETUPS[setup].legend}</span>
      <span className="site-key site-key--mui">MUI</span>
    </Stack>
    <Stack gap={3} greese={{ inView: 'theme', stagger: 0.05, distance: '0.75rem' }}>
      {byWin(setup).map((m) => {
        const value = m[setup]
        const max = Math.max(value, m.mui)
        const v = verdict(m, setup)
        return (
          <Tooltip
            key={m.label}
            content={`GreeseUI ${fmt(value, m.unit)}, MUI ${fmt(m.mui, m.unit)}`}
          >
            <div className="site-metric" tabIndex={0}>
              <Stack direction="row" justify="between" align="baseline" gap={2}>
                <Text variant="p3" weight="semibold">
                  {m.label}
                </Text>
                <Badge tone={v.tone} greese={{ inView: 'pop', delay: 0.4 }}>
                  {v.text}
                </Badge>
              </Stack>
              <Bar lib="greese" value={value} max={max} unit={m.unit} />
              <Bar lib="mui" value={m.mui} max={max} unit={m.unit} />
            </div>
          </Tooltip>
        )
      })}
    </Stack>
  </Stack>
)

const DataTable = (): JSX.Element => (
  <Table
    caption="GreeseUI vs MUI benchmark medians"
    hideCaption
    stackBelow="sm"
    greese={{ inView: 'theme' }}
  >
    <TableHead>
      <TableRow>
        <TableHeaderCell>Metric</TableHeaderCell>
        <TableHeaderCell align="end">GreeseUI</TableHeaderCell>
        <TableHeaderCell align="end">GreeseUI, per-component CSS</TableHeaderCell>
        <TableHeaderCell align="end">MUI</TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody greese={{ inView: 'theme', stagger: 0.03, distance: '0.75rem' }}>
      {byWin().map((m) => (
        <TableRow key={m.label}>
          <TableCell label="Metric">{m.label}</TableCell>
          <TableCell label="GreeseUI" align="end">
            {fmt(m.greese, m.unit)}
          </TableCell>
          <TableCell label="GreeseUI, per-component CSS" align="end">
            {fmt(m.greeseCss, m.unit)}
          </TableCell>
          <TableCell label="MUI" align="end">
            {fmt(m.mui, m.unit)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

/** The headline: wins out of the total, and main-thread work on load. */
const Summary = ({ setup }: { setup: Setup }): JSX.Element => {
  const tally = scorecard(setup)
  const ours = mainThread(setup)
  const theirs = mainThread('mui')
  return (
    <Grid
      container
      columns={{ xs: 1, sm: 2 }}
      gap={3}
      greese={{ inView: 'theme', stagger: 0.08 }}
    >
      <Card variant="filled" padding={4}>
        <Text variant="h3" weight="bold" className="site-stat-value">
          {tally.win} of {benchmark.metrics.length}
        </Text>
        <Text variant="p3" tone="muted">
          metrics where GreeseUI is ahead
          {tally.even ? `, ${tally.even} even` : ''}
          {tally.loss ? `, ${tally.loss} where MUI is` : ''}
        </Text>
      </Card>
      <Card variant="filled" padding={4}>
        <Text variant="h3" weight="bold" className="site-stat-value">
          {(theirs / ours).toFixed(1)}× less
        </Text>
        <Text variant="p3" tone="muted">
          main-thread work on load: {fmt(ours, 'ms')} against MUI’s {fmt(theirs, 'ms')}{' '}
          (script, style and layout)
        </Text>
      </Card>
    </Grid>
  )
}

export const Speed = (): JSX.Element => {
  const [view, setView] = useState('chart')
  const [setup, setSetup] = useState<Setup>('greese')
  return (
    <Section
      id="speed"
      eyebrow="Speed"
      title="Faster than MUI where users feel it"
      intro={
        <>
          {benchmark.stacks.toLocaleString('en')} responsive Stacks, a production build,
          Chromium at {benchmark.cpu}× CPU throttling (roughly a mid-range phone). Medians
          of {benchmark.runs} rotating runs, measured {benchmark.date}.
        </>
      }
    >
      <Summary setup={setup} />
      <Card padding={{ xs: 4, md: 6 }} greese={{ inView: 'theme' }}>
        <Stack gap={5}>
          <Stack direction="row" gap={3} wrap="wrap">
            <SegmentedControl
              label="Show the results as"
              size="sm"
              value={view}
              onValueChange={setView}
              greese={{ inView: 'theme' }}
            >
              <Segment value="chart">Chart</Segment>
              <Segment value="table">Table</Segment>
            </SegmentedControl>
            {view === 'chart' && (
              <SegmentedControl
                label="GreeseUI CSS"
                size="sm"
                value={setup}
                onValueChange={(v) => setSetup(v as Setup)}
                greese={{ inView: 'theme', delay: 0.1 }}
              >
                {(Object.keys(SETUPS) as Setup[]).map((s) => (
                  <Segment key={s} value={s}>
                    {SETUPS[s].label}
                  </Segment>
                ))}
              </SegmentedControl>
            )}
          </Stack>
          {view === 'chart' ? <Chart setup={setup} /> : <DataTable />}
        </Stack>
      </Card>
      <Text tone="muted" className="site-measure" greese={{ inView: 'theme' }}>
        Where MUI still comes out ahead: style recalculation. MUI generates one class per
        distinct style at runtime, so each element matches a single short rule; GreeseUI’s
        classes are compiled ahead of time, so an element matches several, inside cascade
        layers that let your CSS win. That costs the browser a little more, and saves the
        JavaScript that generating styles takes, which is the script time above.
        Per-component CSS, which ships only the stylesheets you import, narrows the gap.
        GreeseUI adds {benchmark.styleElements.greese} &lt;style&gt; elements at runtime;
        MUI adds {benchmark.styleElements.mui}. Run it yourself with{' '}
        <Code>npm run bench -w playground</Code>.
      </Text>
    </Section>
  )
}
