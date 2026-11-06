import type { JSX, ReactNode } from 'react'
import { Accordion, AccordionItem, Stack, TextField } from '@greese/react'
import { scalarTokens } from '@greese/ui'
import { getIn, setIn } from '../edit.ts'
import { ValueRow } from '../fields.tsx'
import type { RenderedColors } from '../protocol.ts'
import type { ThemeSpec } from '../spec.ts'
import { ColorsSection } from './ColorsSection.tsx'
import { CustomTokens } from './CustomTokens.tsx'
import { BreakpointsSection } from './BreakpointsSection.tsx'
import { RadiusSection } from './RadiusSection.tsx'
import { TypographySection } from './TypographySection.tsx'
import { kebab } from '../naming.ts'

interface PanelProps {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  /** Each color as the preview renders it, once it has reported. */
  rendered?: RenderedColors
  /** The stylesheet is being rebuilt for new breakpoints. */
  building?: boolean
}

/** The other token groups, after color and radius, which have editors of their own. */
const MORE = Object.entries(scalarTokens).filter(([group]) => group !== 'radius')

/** Every token group's title and editor, in alphabetical order. */
const sections = (
  spec: ThemeSpec,
  onChange: (spec: ThemeSpec) => void,
  rendered: RenderedColors | undefined,
  building: boolean
): [string, ReactNode][] =>
  (
    [
      [
        'color',
        <Stack key="color" gap={4}>
          <ColorsSection spec={spec} onChange={onChange} rendered={rendered} />
          <CustomTokens
            spec={spec}
            onChange={onChange}
            group="color"
            rendered={rendered}
          />
        </Stack>,
      ],
      [
        'radius',
        <Stack key="radius" gap={4}>
          <RadiusSection spec={spec} onChange={onChange} />
          <CustomTokens spec={spec} onChange={onChange} group="radius" />
        </Stack>,
      ],
      ...MORE.map(([group, values]): [string, ReactNode] => [
        kebab(group),
        <Stack key={group} gap={2}>
          {Object.entries(values).map(([key, fallback]) => {
            const path = ['tokens', kebab(group), kebab(key)]
            return (
              <ValueRow
                key={key}
                label={`${kebab(group)}-${kebab(key)}`}
                value={(getIn(spec, path) as string | undefined) ?? ''}
                placeholder={fallback}
                onChange={(v) => onChange(setIn(spec, path, v))}
              />
            )
          })}
          <CustomTokens spec={spec} onChange={onChange} group={kebab(group)} />
        </Stack>,
      ]),
      [
        'typography',
        <TypographySection key="typography" spec={spec} onChange={onChange} />,
      ],
      [
        'breakpoint',
        <BreakpointsSection
          key="breakpoint"
          spec={spec}
          onChange={onChange}
          building={building}
        />,
      ],
    ] satisfies [string, ReactNode][]
  ).sort(([a], [b]) => a.localeCompare(b))

export const TokensPanel = ({
  spec,
  onChange,
  rendered,
  building = false,
}: PanelProps): JSX.Element => (
  <Stack gap={6}>
    <TextField
      label="Theme name"
      description="Empty: change the page's defaults. A name scopes a complete theme to data-greese-theme, for ThemeProvider."
      placeholder="brand"
      size="sm"
      value={spec.name ?? ''}
      onChange={(e) => onChange(setIn(spec, ['name'], e.currentTarget.value))}
    />
    <Accordion aria-label="Tokens">
      {sections(spec, onChange, rendered, building).map(([title, body]) => (
        <AccordionItem key={title} title={title} defaultOpen={title === 'color'}>
          {body}
        </AccordionItem>
      ))}
    </Accordion>
  </Stack>
)
