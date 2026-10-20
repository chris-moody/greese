/**
 * The SCSS kit's sources as a module, `virtual:greese-kit`, for the hosted
 * studio (src/hosted.ts), which compiles in the browser: every partial of
 * `@greese/react/scss/kit` and the token maps it reads, keyed by a virtual
 * path (`/react/_kit.scss`, `/tokens/_maps.scss`).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const DIRS = {
  react: join(ROOT, 'packages/react/src/styles'),
  tokens: join(ROOT, 'packages/ui/dist'),
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
        files[`/${name}/${file}`] = readFileSync(join(dir, file), 'utf8')
      }
    return `export default ${JSON.stringify(files)}`
  },
})
