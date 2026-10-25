/**
 * Fails the build when a chunk that must run before its importers sits on an
 * import cycle: the chunk with Rolldown's runtime helpers
 * (`\0rolldown/runtime.js`: `__commonJSMin`, `__toESM`…), or one that wraps
 * CommonJS modules (React: `require_react`).
 *
 * Their importers call what they define at the top level. On a cycle, the
 * browser runs an importer first, while the definitions are still undefined,
 * and the page stays blank ("__commonJSMin is not a function", "require_react
 * is not a function"). Chunk groups decide which chunks import which, and
 * Rolldown places the helpers itself, so a change to the groups (or to what a
 * page imports) can bring the cycle back. Nothing else catches it: the build
 * succeeds and the dev server never splits chunks.
 */
import type { Plugin } from 'vite'

export interface ChunkInfo {
  imports: string[]
  modules: string[]
  /** Whether it holds CommonJS modules, which it wraps for its importers. */
  wrapsCommonJs?: boolean
}

/** The first cycle through a chunk that must run first, as file names, or undefined. */
export const runtimeCycle = (chunks: Record<string, ChunkInfo>): string[] | undefined => {
  const first = Object.keys(chunks).filter(
    (file) =>
      chunks[file]!.wrapsCommonJs ||
      chunks[file]!.modules.some((id) => id.startsWith('\0rolldown/runtime'))
  )
  for (const home of first) {
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
    const cycle = walk(home, [home])
    if (cycle) return cycle
  }
  return undefined
}

export const runtimeChunkGuard = (): Plugin => ({
  name: 'greese-runtime-chunk-guard',
  apply: 'build',
  generateBundle(_, bundle) {
    const chunks: Record<string, ChunkInfo> = {}
    for (const [file, output] of Object.entries(bundle))
      if (output.type === 'chunk')
        chunks[file] = {
          imports: output.imports,
          modules: Object.keys(output.modules),
          // From the module graph, not the code: the code is minified by now.
          wrapsCommonJs: Object.keys(output.modules).some(
            (id) => this.getModuleInfo(id)?.inputFormat === 'cjs'
          ),
        }
    const cycle = runtimeCycle(chunks)
    if (cycle)
      this.error(
        `${cycle[0]} defines what its importers run first (Rolldown's runtime helpers, or CommonJS wrappers such as React's), and it's on an import cycle (${cycle.join(' → ')}): the page would stay blank. Change the chunk groups in vite.config.ts so nothing it imports imports it back.`
      )
  },
})
