// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compileString, NodePackageImporter } from 'sass-embedded'
import { describe, expect, it } from 'vitest'
import { blocks, STYLES } from '../test/sass.ts'

/**
 * A closed popover has to be `display: none`, and only the user agent says so:
 * `[popover]:not(:popover-open) { display: none }`. That rule is in the UA
 * origin, which every author rule beats — so declaring `display` on a popover
 * *unconditionally* leaves it laid out and hit-testable while closed. It is
 * invisible, because the overlay exit sets `opacity: 0`, and it quietly takes
 * presses meant for whatever is beneath it.
 *
 * It cost a bug report: `EditableField`'s colour picker did this, and its
 * pickers looked like they were opening themselves, because the closed popover
 * sitting over the controls was eating the clicks. Nothing else catches it —
 * the CSS is valid, the markup is right, and the compiler, stylelint, the unit
 * tests and axe are all happy.
 *
 * Two kinds of class land on a popover, and each is found from a source that
 * cannot drift:
 *
 * - **An overlay's own root.** `floating.enter-exit` emits a
 *   `…:not(:popover-open)` rule for precisely these, so the compiled CSS names
 *   them. Guessing from component names does not work: `SpeedDial`'s popover
 *   is `greese-SpeedDial-actions`, and `greese-SpeedDial` is the wrapper round
 *   its button.
 * - **A class a component hands an overlay as `className`** — the case that
 *   bit. `greese-EditableField-picker` is styled by `EditableField.scss` while
 *   the `popover` attribute is `Popover`'s, so nothing in the stylesheet marks
 *   it as an overlay at all.
 */

const COMPONENTS = fileURLToPath(new URL('.', import.meta.url))
const REACT = fileURLToPath(new URL('../../../react/src/', import.meta.url))

/** The components an overlay class can be passed to as `className`. */
const OVERLAYS = ['Popover', 'ContextMenu', 'Menu', 'Tooltip', 'Dialog', 'Drawer']

/**
 * The one intended exception, documented in `Sidebar.scss`: above the layout's
 * breakpoint the sidebar is a docked sticky column, never opened as a popover,
 * and it *relies* on an author `display` overriding the UA rule. The selector
 * is qualified by the layout class, so it can never match an off-canvas one.
 */
const DOCKED_SIDEBAR = /^\.greese-SidebarLayout--\w+ > \.greese-Sidebar$/

interface Sheet {
  name: string
  css: string
}

/** Every component stylesheet, compiled. */
const stylesheets = (): Sheet[] => {
  const out: Sheet[] = []
  for (const entry of readdirSync(COMPONENTS, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const path = `${COMPONENTS}${entry.name}/${entry.name}.scss`
    // Only a missing stylesheet is skipped. A compile failure must not be:
    // swallowing one is how this check first passed while the very bug it
    // exists for was sitting in the tree.
    if (!existsSync(path)) continue
    out.push({
      name: entry.name,
      // `url` so the sheet's own relative `@use '../../styles/…'` resolves.
      css: compileString(readFileSync(path, 'utf8'), {
        url: new URL(`file://${path}`),
        loadPaths: [STYLES],
        importers: [new NodePackageImporter()],
      }).css,
    })
  }
  return out
}

/** The overlay roots, from the `:not(:popover-open)` rule the mixin emits. */
const overlayRoots = (sheets: Sheet[]): Set<string> => {
  const found = new Set<string>()
  for (const { css } of sheets) {
    for (const match of css.matchAll(/\.(greese-[\w-]+):not\(:popover-open\)/g)) {
      const cls = match[1]
      if (cls) found.add(cls)
    }
  }
  return found
}

/** Every `display` declared on one lone class, with nothing qualifying it. */
const bareDisplayRules = (sheets: Sheet[]): Array<{ name: string; cls: string }> => {
  const found: Array<{ name: string; cls: string }> = []
  for (const { name, css } of sheets) {
    for (const block of blocks(css)) {
      if (!block.declarations.some(([property]) => property === 'display')) continue
      const selector = block.prelude.trim()
      if (DOCKED_SIDEBAR.test(selector)) continue
      // No pseudo-class, no attribute, no ancestor, no combinator.
      const bare = /^\.(greese-[\w-]+)$/.exec(selector)
      if (bare) found.push({ name, cls: bare[1]! })
    }
  }
  return found
}

/** The react components' source, as one string. */
const reactSource = (dir = REACT): string =>
  readdirSync(dir, { withFileTypes: true })
    .map((entry) =>
      entry.isDirectory()
        ? reactSource(`${dir}${entry.name}/`)
        : entry.name.endsWith('.tsx')
          ? readFileSync(`${dir}${entry.name}`, 'utf8')
          : ''
    )
    .join('\n')

/** Whether `cls` is handed to an overlay component as its `className`. */
const passedToOverlay = (cls: string, source: string): boolean => {
  const opening = new RegExp(`<(?:${OVERLAYS.join('|')})\\b`, 'g')
  for (const match of source.matchAll(opening)) {
    // The element's own attributes: generous enough to span a formatted tag,
    // and only consulted for a class that already declares `display`, so a
    // coincidence would need both halves to line up.
    const tag = source.slice(match.index, match.index + 600)
    // `(?![\w-])`, not `\b`: a word boundary does not stop at a hyphen, so
    // `greese-EditableField` would match inside `greese-EditableField-picker`
    // and flag the field's own root as if it were the popover.
    const exact = `(?<![\\w-])${cls}(?![\\w-])`
    if (new RegExp(`className=(?:"[^"]*${exact}|\\{[^}]*${exact})`).test(tag)) {
      return true
    }
  }
  return false
}

describe('a closed popover is display: none', () => {
  const sheets = stylesheets()

  it('reads every component stylesheet', () => {
    // Guards the guard: a much smaller number means the walk or the compile
    // quietly stopped working, and the check below would pass for nothing.
    expect(sheets.length).toBeGreaterThan(50)
  })

  it('finds the overlay roots from the CSS the mixin emits', () => {
    const roots = overlayRoots(sheets)
    expect(roots).toContain('greese-Popover')
    expect(roots).toContain('greese-Menu')
    // The wrapper is not the popover; the actions list is.
    expect(roots).toContain('greese-SpeedDial-actions')
    expect(roots).not.toContain('greese-SpeedDial')
  })

  it('finds a class a component passes an overlay', () => {
    expect(passedToOverlay('greese-EditableField-picker', reactSource())).toBe(true)
    expect(passedToOverlay('greese-Button', reactSource())).toBe(false)
  })

  it('no stylesheet declares `display` on a popover unqualified', () => {
    const roots = overlayRoots(sheets)
    const source = reactSource()
    const offenders = bareDisplayRules(sheets)
      .filter(({ cls }) => roots.has(cls) || passedToOverlay(cls, source))
      .map(({ name, cls }) => `${name}.scss — .${cls} { display: … }`)

    expect(offenders).toEqual([])
  })
})
