import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const here = import.meta.dirname
const ids = [
  ...readFileSync(join(here, 'index.ts'), 'utf8').matchAll(/^ {4}id: '([a-z0-9-]+)'/gm),
].map((m) => m[1]!)

describe('template screenshots', () => {
  it.each(ids)('%s has its light and dark screenshot (npm run shots -w site)', (id) => {
    for (const scheme of ['light', 'dark'])
      expect(
        existsSync(join(here, 'shots', `${id}-${scheme}.webp`)),
        `${id}-${scheme}`
      ).toBe(true)
  })
})
