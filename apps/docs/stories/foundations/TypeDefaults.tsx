import type { JSX } from 'react'
import { typeVariants, typography } from '@greese/ui'

const POINTS = ['base', 'sm', 'md', 'lg', 'xl'] as const

const cell = {
  padding: '0.375rem 0.75rem',
  border: '1px solid var(--greese-color-border)',
  textAlign: 'start' as const,
  verticalAlign: 'top' as const,
}

/**
 * The type variants' default values, a row per variant and a column per
 * breakpoint: an empty cell keeps the value from the smaller breakpoint.
 */
export const TypeDefaults = (): JSX.Element => (
  <div
    className="docs-table-scroll"
    role="region"
    aria-label="Default type values"
    tabIndex={0}
    style={{ overflowX: 'auto' }}
  >
    <table style={{ borderCollapse: 'collapse', fontSize: '0.875rem' }}>
      <thead>
        <tr>
          <th style={{ ...cell, whiteSpace: 'nowrap' }}>variant</th>
          {POINTS.map((point) => (
            <th key={point} style={{ ...cell, whiteSpace: 'nowrap' }}>
              {point}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {typeVariants.map((variant) => (
          <tr key={variant}>
            <th style={{ ...cell, whiteSpace: 'nowrap' }}>{variant}</th>
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
)
