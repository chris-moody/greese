import type { ThemeSpec } from './spec.ts'

type Tree = Record<string, unknown>

/**
 * A copy of the spec with `path` set to `value`. An empty value deletes the
 * key, and objects left empty are pruned, so the saved JSON only holds what
 * the theme actually changes.
 */
export const setIn = (spec: ThemeSpec, path: string[], value: unknown): ThemeSpec => {
  const next = structuredClone(spec) as Tree
  const trail: Tree[] = [next]
  let node = next
  for (const key of path.slice(0, -1)) {
    if (typeof node[key] !== 'object' || node[key] === null) node[key] = {}
    node = node[key] as Tree
    trail.push(node)
  }
  const last = path.at(-1)!
  if (value === '' || value === undefined) delete node[last]
  else node[last] = value
  // Prune emptied objects bottom-up, keeping the top-level groups.
  for (let i = trail.length - 1; i > 1; i--) {
    if (Object.keys(trail[i]!).length === 0) delete trail[i - 1]![path[i - 1]!]
  }
  return next as ThemeSpec
}

export const getIn = (spec: ThemeSpec, path: string[]): unknown =>
  path.reduce<unknown>(
    (node, key) => (node && typeof node === 'object' ? (node as Tree)[key] : undefined),
    spec
  )
