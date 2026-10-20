/**
 * The SCSS kit's sources as a module, `virtual:greese-kit`, for the hosted
 * studio (src/hosted.ts), which compiles in the browser: every partial of
 * `@greese/ui/scss/kit` and the token maps it reads (generated into dist),
 * keyed by their path inside the package (`/src/styles/_kit.scss`,
 * `/dist/_maps.scss`), so the kit's relative `@use`s resolve as they do on disk.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const UI = join(dirname(fileURLToPath(import.meta.url)), '../../../packages/ui')
const DIRS = {
  '/src/styles': join(UI, 'src/styles'),
  '/dist': join(UI, 'dist'),
}
const ID = 'virtual:greese-kit'

export const kitSources = (): Plugin => ({
  name: 'greese-kit-sources',
  resolveId: (id) => (id === ID ? `\0${ID}` : undefined),
  load(id) {
    if (id !== `\0${ID}`) return
    const files: Record<string, string> = {}
    for (const [name, dir] of Object.entries(DIRS))
      for (const file of readdirSync(dir).filter((f) => /^_.*\.scss$/.test(f))) {
        this.addWatchFile(join(dir, file))
        files[`${name}/${file}`] = readFileSync(join(dir, file), 'utf8')
      }
    return `export default ${JSON.stringify(files)}`
  },
})
