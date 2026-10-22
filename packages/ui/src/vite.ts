import { purgeFiles, type ContentOptions } from './utilitiesFiles.ts'
import type { PurgeOptions } from './utilities.ts'

/** The module to import: `import 'virtual:greese-utilities.css'`. */
export const UTILITIES_MODULE = 'virtual:greese-utilities.css'
const RESOLVED = `\0${UTILITIES_MODULE}`

interface ModuleNode {
  id?: string | null
}

/** The part of Vite's plugin API this uses, so @greese/ui needs no dependency on Vite. */
export interface UtilitiesPlugin {
  name: string
  resolveId(id: string): string | undefined
  load(
    this: { addWatchFile?: (file: string) => void },
    id: string
  ): Promise<string | undefined>
  handleHotUpdate(context: {
    file: string
    server: {
      moduleGraph: {
        getModuleById(id: string): ModuleNode | undefined
        invalidateModule(m: ModuleNode): void
      }
    }
  }): ModuleNode[] | undefined
}

/**
 * A Vite plugin that serves only the utility classes your source uses, as
 * `virtual:greese-utilities.css`: it reads the files `content` matches, keeps
 * the classes they spell out (`purgeUtilities`), and rebuilds when one changes.
 * The same CSS `greese-utilities --content …` writes to a file.
 *
 * ```ts
 * // vite.config.ts
 * import { greeseUtilities } from '@greese/ui/vite'
 * export default { plugins: [greeseUtilities({ content: ['index.html', 'src/**\/*.{ts,tsx}'] })] }
 * // main.tsx
 * import 'virtual:greese-utilities.css'
 * ```
 */
export const greeseUtilities = (
  options: ContentOptions & Omit<PurgeOptions, 'content'>
): UtilitiesPlugin => {
  let files = new Set<string>()
  return {
    name: 'greese-utilities',
    resolveId: (id) => (id === UTILITIES_MODULE ? RESOLVED : undefined),
    async load(id) {
      if (id !== RESOLVED) return undefined
      const result = await purgeFiles(options)
      files = new Set(result.files)
      for (const file of files) this.addWatchFile?.(file)
      return result.css
    },
    handleHotUpdate({ file, server }) {
      if (!files.has(file)) return undefined
      const module = server.moduleGraph.getModuleById(RESOLVED)
      if (!module) return undefined
      server.moduleGraph.invalidateModule(module)
      return [module]
    },
  }
}
