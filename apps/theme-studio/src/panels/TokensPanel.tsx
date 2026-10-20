import type { JSX } from 'react'
import { Accordion, AccordionItem, Stack, Text, TextField } from '@greese/react'
import { breakpoints, scalarTokens } from '@greese/ui'
import { getIn, setIn } from '../edit.ts'
import { ValueRow } from '../fields.tsx'
import type { RenderedColors } from '../protocol.ts'
import type { ThemeSpec } from '../spec.ts'
import { ColorsSection } from './ColorsSection.tsx'
import { CustomTokens } from './CustomTokens.tsx'
import { RadiusSection } from './RadiusSection.tsx'
import { TypographySection } from './TypographySection.tsx'

export const kebab = (value: string): string =>
  value.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

interface PanelProps {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  /** Each color as the preview renders it, once it has reported. */
  rendered?: RenderedColors
}

/** The other token groups, after color and radius, which have editors of their own. */
const MORE = Object.entries(scalarTokens).filter(([group]) => group !== 'radius')

export const TokensPanel = ({ spec, onChange, rendered }: PanelProps): JSX.Element => (
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
      <AccordionItem title="color" defaultOpen>
        <Stack gap={4}>
          <ColorsSection spec={spec} onChange={onChange} rendered={rendered} />
          <CustomTokens
            spec={spec}
            onChange={onChange}
            group="color"
            rendered={rendered}
          />
        </Stack>
      </AccordionItem>
      <AccordionItem title="radius">
        <Stack gap={4}>
          <RadiusSection spec={spec} onChange={onChange} />
          <CustomTokens spec={spec} onChange={onChange} group="radius" />
        </Stack>
      </AccordionItem>
      {MORE.map(([group, values]) => (
        <AccordionItem key={group} title={kebab(group)}>
          <Stack gap={2}>
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
          </Stack>
        </AccordionItem>
      ))}
      <AccordionItem title="typography">
        <TypographySection spec={spec} onChange={onChange} />
      </AccordionItem>
      <AccordionItem title="breakpoint">
        <Stack gap={2}>
          <Text size="sm" tone="muted">
            Fixed when the stylesheet is built, so a theme can&apos;t change them: media
            queries can&apos;t read variables. Set them (and add keys) by compiling with
            your own <code className="studio-mono">$breakpoints</code>; each key also
            becomes a custom property you can read in CSS.
          </Text>
          {Object.entries(breakpoints).map(([key, value]) => (
            <div className="studio-row" key={key}>
              <Text size="sm" className="studio-row-label">
                breakpoint-{key}
              </Text>
              <code className="studio-mono">{value}px</code>
            </div>
          ))}
        </Stack>
      </AccordionItem>
    </Accordion>
  </Stack>
)
