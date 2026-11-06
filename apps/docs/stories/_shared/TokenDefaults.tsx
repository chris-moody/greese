import type { JSX } from 'react'
import { color, cssProperty as kebab, scalarTokens } from '@greese/ui'
import { Accordion, AccordionItem } from '@greese/react'

/** What each group's values are, as a theme writes them. */
const TYPES: Record<string, string> = {
  color:
    'A CSS color, a palette name (`"orange-700"`), or a `(light: …, dark: …)` pair of either',
  space: 'A length',
  radius: 'A length',
  corner: 'A length, or a radius token: `var(--greese-radius-lg)`',
  font: 'A font-family list',
  fontWeight: 'A font weight: `400`, `600`',
  lineHeight: 'A unitless number',
  shadow: 'A box-shadow',
  zIndex: 'An integer',
  duration: 'A time: `200ms`',
  easing: 'An easing function: `cubic-bezier(…)`, `linear`',
}

const GROUPS: Array<[string, Record<string, string | { light: string; dark: string }>]> =
  [['color', color], ...Object.entries(scalarTokens)]

/**
 * Every token group a theme can set, with each key's default and the values
 * it takes: from the tables the stylesheet is built from, so it's always the
 * library's. A group per accordion item, as the theme layout's token files
 * are a file per group.
 */
export const TokenDefaults = (): JSX.Element => (
  <Accordion>
    {GROUPS.map(([group, values]) => (
      <AccordionItem key={group} title={`${kebab(group)}: tokens/_${kebab(group)}.scss`}>
        <p>
          {TYPES[group]
            ?.split('`')
            .map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))}
          . Each is <code>{`--greese-${kebab(group)}-<key>`}</code>.
        </p>
        <div
          className="docs-table-scroll"
          role="region"
          aria-label={`${kebab(group)} tokens`}
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>{group === 'color' ? 'Light' : 'Default'}</th>
                {group === 'color' && <th>Dark</th>}
              </tr>
            </thead>
            <tbody>
              {Object.entries(values).map(([key, value]) => (
                <tr key={key}>
                  <td>
                    <code>{kebab(key)}</code>
                  </td>
                  {typeof value === 'string' ? (
                    <td>
                      <code>{value}</code>
                    </td>
                  ) : (
                    <>
                      <td>
                        <code>{value.light}</code>
                      </td>
                      <td>
                        <code>{value.dark}</code>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AccordionItem>
    ))}
  </Accordion>
)
