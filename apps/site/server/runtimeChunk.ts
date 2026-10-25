/**
 * Fails the build when Rolldown's runtime helpers sit in a chunk on an
 * import cycle.
 *
 * The helpers (`\0rolldown/runtime.js`: `__commonJSMin`, `__toESM`…) wrap
 * React's CommonJS. Rolldown puts them in a chunk the entries share, and
 * chunk groups can't move them (the module never reaches a group's `test`).
 * When that chunk imports, through others, the chunk that imports it back,
 * the browser runs React's chunk first, the helpers are still undefined, and
 * the page stays blank with "__commonJSMin is not a function". Nothing else
 * catches it: the build succeeds and the dev server never splits chunks.
 */
import type { Plugin } from 'vite'

export interface ChunkInfo {
  imports: string[]
  modules: string[]
}

/** The cycle through the runtime's chunk, as file names, or undefined. */
export const runtimeCycle = (chunks: Record<string, ChunkInfo>): string[] | undefined => {
  const home = Object.keys(chunks).find((file) =>
    chunks[file]!.modules.some((id) => id.startsWith('\0rolldown/runtime'))
  )
  if (!home) return undefined
  const seen = new Set<string>()
  const walk = (file: string, path: string[]): string[] | undefined => {
    for (const next of chunks[file]?.imports ?? []) {
      if (next === home) return [...path, next]
      if (seen.has(next)) continue
      seen.add(next)
      const found = walk(next, [...path, next])
      if (found) return found
    }
    return undefined
  }
  return walk(home, [home])
}

export const runtimeChunkGuard = (): Plugin => ({
  name: 'greese-runtime-chunk-guard',
  apply: 'build',
  generateBundle(_, bundle) {
    const chunks: Record<string, ChunkInfo> = {}
    for (const [file, output] of Object.entries(bundle))
      if (output.type === 'chunk')
        chunks[file] = { imports: output.imports, modules: Object.keys(output.modules) }
    const cycle = runtimeCycle(chunks)
    if (cycle)
      this.error(
        `Rolldown's runtime helpers are in ${cycle[0]}, on an import cycle (${cycle.join(' → ')}): the page would stay blank ("__commonJSMin is not a function"). Put the shared module that pulls them there into the react chunk group in vite.config.ts.`
      )
  },
})
