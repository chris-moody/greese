/**
 * The SCSS kit's sources as modules, for the hosted studio (src/hosted.ts),
 * which compiles in the browser, keyed by their path inside @greese/ui so the
 * kit's relative `@use`s resolve as they do on disk:
 *
 *   virtual:greese-kit         what the kit reads: src/styles/_*.scss and the
 *                              generated token modules in dist/ (small, always)
 *   virtual:greese-stylesheet  the rest of the stylesheet: every component's SCSS
 *                              and the entry points (a lazy chunk, for building
 *                              the whole stylesheet with other breakpoints)
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const UI = join(dirname(fileURLToPath(import.meta.url)), '../../../packages/ui')
const read = (dir: string, accept: (file: string) => boolean, prefix: string) =>
  readdirSync(join(UI, dir))
    .filter(accept)
    .map((file) => [`${prefix}/${file}`, join(UI, dir, file)] as const)

const kit = () => [
  ...read('src/styles', (f) => /^_.*\.scss$/.test(f), '/src/styles'),
  ...read('dist', (f) => /^_.*\.scss$/.test(f), '/dist'),
]

const stylesheet = () => [
  ...read('src/styles', (f) => /^[^_].*\.scss$/.test(f), '/src/styles'),
  ...readdirSync(join(UI, 'src/components'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map(
      (entry) =>
        [
          `/src/components/${entry.name}/${entry.name}.scss`,
          join(UI, 'src/components', entry.name, `${entry.name}.scss`),
        ] as const
    ),
]

const MODULES = { 'virtual:greese-kit': kit, 'virtual:greese-stylesheet': stylesheet }

export const kitSources = (): Plugin => ({
  name: 'greese-kit-sources',
  resolveId: (id) => (id in MODULES ? `\0${id}` : undefined),
  load(id) {
    const source = MODULES[id.slice(1) as keyof typeof MODULES]
    if (!id.startsWith('\0') || !source) return
    const files: Record<string, string> = {}
    for (const [key, path] of source()) {
      this.addWatchFile(path)
      files[key] = readFileSync(path, 'utf8')
    }
    return `export default ${JSON.stringify(files)}`
  },
})
