import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack, Text } from '@greese/react'
import { typeVariants, typography, type TypeVariant } from '@greese/ui'

const meta = { title: 'Foundations/Typography' } satisfies Meta
export default meta

const SAMPLES: Record<TypeVariant, string> = {
  h1: 'Heading one',
  h2: 'Heading two',
  h3: 'Heading three',
  h4: 'Heading four',
  h5: 'Heading five',
  h6: 'Heading six',
  s1: 'Subtitle one: a line that introduces',
  s2: 'Subtitle two: a smaller introduction',
  p1: 'Paragraph one: the larger body text, for lead paragraphs and long reading.',
  p2: 'Paragraph two: the default body text for most content in an app.',
  p3: 'Paragraph three: compact body text, for dense interfaces.',
  caption: 'Caption: small print, labels and helper text',
  button: 'Button text',
}

/** Every variant, set by its own custom properties. Resize the window to watch the breakpoints change them. */
export const Variants: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <Stack gap={4}>
      {typeVariants.map((variant) => (
        <Stack
          key={variant}
          direction={{ xs: 'column', md: 'row' }}
          gap={{ xs: 1, md: 4 }}
        >
          <Text variant="caption" tone="muted" style={{ minInlineSize: '5rem' }}>
            {variant}
          </Text>
          <Text variant={variant}>{SAMPLES[variant]}</Text>
        </Stack>
      ))}
    </Stack>
  ),
}

const POINTS = ['base', 'sm', 'md', 'lg', 'xl'] as const

/** The default values: where a cell is empty, the variant keeps the value from the smaller breakpoint. */
export const DefaultValues: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th style={cell}>variant</th>
            {POINTS.map((point) => (
              <th key={point} style={cell}>
                {point}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {typeVariants.map((variant) => (
            <tr key={variant}>
              <th style={cell}>{variant}</th>
              {POINTS.map((point) => {
                const style = (
                  typography[variant] as Record<string, Record<string, string>>
                )[point]
                return (
                  <td key={point} style={cell}>
                    {style && (
                      <code>
                        {Object.entries(style)
                          .map(([prop, value]) => `${prop}: ${value}`)
                          .join(', ')}
                      </code>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}

const cell = {
  padding: '0.375rem 0.75rem',
  border: '1px solid var(--greese-color-border)',
  textAlign: 'start' as const,
  verticalAlign: 'top' as const,
}
