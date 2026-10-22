import type { JSX } from 'react'
import { utilityClasses, type UtilityGroup } from '@greese/ui'

const TITLES: Record<UtilityGroup, string> = {
  spacing: 'Spacing',
  sizing: 'Sizing',
  layout: 'Layout',
  flex: 'Flexbox',
  grid: 'Grid',
  typography: 'Text',
  border: 'Borders, radius and shadow',
  color: 'Color',
  effects: 'Effects and interaction',
}

const GROUPS = Object.keys(TITLES) as UtilityGroup[]

/** Every utility class, from the table the CSS is written from, grouped as the guide is. */
export const UtilityClasses = (): JSX.Element => {
  const all = utilityClasses()
  const stems = new Map<string, { group: UtilityGroup; values: string[] }>()
  for (const c of all.filter((c) => !c.variant)) {
    const entry = stems.get(c.stem) ?? { group: c.group, values: [] }
    entry.values.push(c.value)
    stems.set(c.stem, entry)
  }
  const flags = (stem: string) => {
    const bps = new Set(
      all
        .filter((c) => c.stem === stem && c.variant && c.variant !== 'hover')
        .map((c) => c.variant)
    )
    const hover = all.some((c) => c.stem === stem && c.variant === 'hover')
    return [bps.size ? 'breakpoints' : '', hover ? 'hover' : '']
      .filter(Boolean)
      .join(', ')
  }
  return (
    <>
      {GROUPS.map((group) => (
        <section key={group}>
          <h3>{TITLES[group]}</h3>
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Values</th>
                <th>Variants</th>
              </tr>
            </thead>
            <tbody>
              {[...stems]
                .filter(([, entry]) => entry.group === group)
                .map(([stem, { values }]) => (
                  <tr key={stem}>
                    <td>
                      <code>{`${stem}${values.length === 1 && values[0] === '' ? '' : '-*'}`}</code>
                    </td>
                    <td>{values.map((v) => v || '(none)').join(' · ')}</td>
                    <td>{flags(stem)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ))}
    </>
  )
}
