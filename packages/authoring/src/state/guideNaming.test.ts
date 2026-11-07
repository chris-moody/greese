import { describe, expect, it } from 'vitest'
import { nextGuideName } from './guideNaming.ts'

describe('nextGuideName', () => {
  it('returns "Guide 0" when no guides exist', () => {
    expect(nextGuideName([])).toBe('Guide 0')
  })

  it('returns "Guide 0" when no existing name matches the pattern', () => {
    expect(nextGuideName(['Ground', 'My Guide'])).toBe('Guide 0')
  })

  it('returns one past the highest existing index', () => {
    expect(nextGuideName(['Guide 0', 'Guide 1', 'Guide 3'])).toBe('Guide 4')
  })

  it('ignores unrelated names mixed in with matching ones', () => {
    expect(nextGuideName(['Ground', 'Guide 0', 'Guide 2'])).toBe('Guide 3')
  })
})
