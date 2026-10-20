import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * Fails with a readable list if axe finds violations. Color contrast is off:
 * jsdom has no layout or rendering, so contrast is checked in real browsers.
 */
export const expectNoAxeViolations = async (container: Element): Promise<void> => {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
}
