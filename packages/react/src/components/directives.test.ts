import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * A component without `'use client'` renders as a Server Component, where
 * state, effects, refs, context and functions handed to elements throw. The
 * conventions keep layout and text components server-safe; this keeps the
 * rest marked. (`useId`, `useMemo` and `useCallback` work on the server.)
 */
const CLIENT_ONLY = [
  /\buse(State|Reducer|Effect|LayoutEffect|InsertionEffect|Ref|Context|SyncExternalStore|Transition|Optimistic|ActionState)\(/,
  /\buse\(/,
  // An inline function handed to an element or component: `onClick={(e) => …}`.
  /\bon[A-Z]\w*=\{\s*(\([^)]*\)|\w+)\s*=>/,
]

const dir = join(import.meta.dirname, '.')
const files = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(
  (f) => f.endsWith('.tsx') && !f.includes('.test.')
)

describe("'use client'", () => {
  it.each(files)('%s is marked when it needs the client', (file) => {
    const source = readFileSync(join(dir, file), 'utf8')
    if (/^'use client'/.test(source)) return
    const found = CLIENT_ONLY.map((re) => re.exec(source)?.[0]).filter(Boolean)
    expect(found, `${file} needs 'use client' for ${found.join(', ')}`).toEqual([])
  })
})
