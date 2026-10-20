import { useState, type JSX } from 'react'
import { palette, paletteShades } from '@greese/ui'
import { Grid, Segment, SegmentedControl, Stack, Text } from '@greese/react'

type Format = 'css' | 'scss' | 'ts'

const FORMATS: Record<Format, (hue: string, shade: number) => string> = {
  css: (hue, shade) => `var(--greese-${hue}-${shade})`,
  scss: (hue, shade) => `${hue}-${shade}`,
  ts: (hue, shade) => `palette.${hue}[${shade}]`,
}

/** WCAG relative luminance of a `#rrggbb` color. */
const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

/** Black or white, whichever reads better on the color. */
const inkOn = (hex: string): string =>
  (luminance(hex) + 0.05) / 0.05 > 1.05 / (luminance(hex) + 0.05) ? '#000' : '#fff'

/**
 * Every palette color, a table per hue as on MUI's color page. Clicking a
 * shade copies its reference in the chosen format.
 */
export const PaletteTables = (): JSX.Element => {
  const [format, setFormat] = useState<Format>('css')
  const [status, setStatus] = useState('')

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus(`Copied ${text}`)
    } catch {
      setStatus(`Couldn't copy: your browser blocked the clipboard`)
    }
  }

  return (
    <Stack gap={4}>
      <Stack direction="row" gap={4} align="end" wrap="wrap">
        <SegmentedControl
          label="Copy as"
          hideLabel={false}
          size="sm"
          value={format}
          onValueChange={(v) => setFormat(v as Format)}
        >
          <Segment value="css">CSS variable</Segment>
          <Segment value="scss">SCSS kit</Segment>
          <Segment value="ts">TypeScript</Segment>
        </SegmentedControl>
        <p role="status" className="palette-status">
          {status}
        </p>
      </Stack>
      <Grid container minChildWidth="11rem" gap={4}>
        {Object.entries(palette).map(([hue, shades]) => (
          <section key={hue} aria-label={hue} className="palette-hue">
            <Text asChild size="sm" weight="semibold" className="palette-name">
              <h3>{hue}</h3>
            </Text>
            <ul>
              {paletteShades.map((shade) => {
                const value = shades[shade]
                const reference = FORMATS[format](hue, shade)
                return (
                  <li key={shade}>
                    <button
                      type="button"
                      style={{ background: value, color: inkOn(value) }}
                      aria-label={`${hue} ${shade}, ${value}: copy ${reference}`}
                      title={`Copy ${reference}`}
                      onClick={() => void copy(reference)}
                    >
                      <span>{shade}</span>
                      <span>{value}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </Grid>
      <style>{`
        .palette-status { margin: 0; min-block-size: 1lh; font-size: var(--greese-font-size-sm); color: var(--greese-color-fg-muted); }
        .palette-hue { overflow: hidden; border: 1px solid var(--greese-color-border); border-radius: var(--greese-radius-md); }
        .palette-name { margin: 0; padding: var(--greese-space-2) var(--greese-space-3); text-transform: capitalize; }
        .palette-hue ul { margin: 0; padding: 0; list-style: none; }
        .palette-hue button {
          display: flex; justify-content: space-between; inline-size: 100%;
          padding: var(--greese-space-2) var(--greese-space-3); border: 0; cursor: copy;
          font: var(--greese-font-size-xs) / 1.25 var(--greese-font-mono);
        }
        .palette-hue button:focus-visible { outline: 2px solid var(--greese-color-focus-ring); outline-offset: -4px; }
      `}</style>
    </Stack>
  )
}
