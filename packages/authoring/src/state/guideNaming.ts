/**
 * Computes the next auto-name for a newly created guide.
 * Pure, stateless helper: scans existing guide names for the highest `Guide ${n}`
 * match and returns `Guide ${max + 1}` (or `Guide 0` when no match exists).
 * Numbering is global across every scope (not per-scope) — see guides-tween-
 * bounds-snapping-plan.md's Locked decisions for why.
 *
 * @param existingNames - The set of guide names already in use (e.g., every guide's `name`, across all scopes).
 * @returns The next auto-generated name, e.g. "Guide 0", "Guide 1", etc.
 */
export function nextGuideName(existingNames: Iterable<string>): string {
  const pattern = /^Guide (\d+)$/

  let maxIndex = -1
  for (const name of existingNames) {
    const match = pattern.exec(name)
    if (match) {
      const index = parseInt(match[1]!, 10)
      if (index > maxIndex) {
        maxIndex = index
      }
    }
  }

  return `Guide ${maxIndex + 1}`
}
