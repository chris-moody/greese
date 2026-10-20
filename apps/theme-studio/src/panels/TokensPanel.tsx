import type { JSX } from 'react'
import { Accordion, AccordionItem, Stack, TextField } from '@greese/react'
import { scalarTokens } from '@greese/ui'
import { getIn, setIn } from '../edit.ts'
import { ValueRow } from '../fields.tsx'
import type { RenderedColors } from '../protocol.ts'
import type { ThemeSpec } from '../spec.ts'
import { ColorsSection } from './ColorsSection.tsx'
import { RadiusSection } from './RadiusSection.tsx'

export const kebab = (value: string): string =>
  value.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

interface PanelProps {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  /** Each colour as the preview renders it, once it has reported. */
  rendered?: RenderedColors
}

/** Token groups past colour and radius, collapsed: they change less often. */
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
    <ColorsSection spec={spec} onChange={onChange} rendered={rendered} />
    <RadiusSection spec={spec} onChange={onChange} />
    <Accordion aria-label="More tokens">
      {MORE.map(([group, values]) => (
        <AccordionItem key={group} title={kebab(group)}>
          <Stack gap={2}>
            {Object.entries(values).map(([key, fallback]) => {
              const path = ['tokens', kebab(group), kebab(key)]
              return (
                <ValueRow
                  key={key}
                  label={`--greese-${kebab(group)}-${kebab(key)}`}
                  value={(getIn(spec, path) as string | undefined) ?? ''}
                  placeholder={fallback}
                  onChange={(v) => onChange(setIn(spec, path, v))}
                />
              )
            })}
          </Stack>
        </AccordionItem>
      ))}
    </Accordion>
  </Stack>
)
