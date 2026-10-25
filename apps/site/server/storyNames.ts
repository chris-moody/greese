/**
 * Names the components the docs' story files define for themselves (a
 * `Swatch`, a `SignUpForm`), so "Show code" prints them as written: a
 * production build minifies function names, and the library's own components
 * are named from its exports instead (src/docs/toJsx.ts). Each top-level
 * PascalCase declaration gets a `displayName`, when it's a function without
 * one. Only apps/docs/stories; nothing else in the app changes.
 */
import type { Plugin } from 'vite'

const STORY_FILE = /\/apps\/docs\/stories\/.+\.tsx$/

/** The PascalCase names a module declares at its top level. */
export const declaredComponents = (code: string): string[] => [
  ...new Set(
    [...code.matchAll(/^(?:export\s+)?(?:const|function)\s+([A-Z]\w*)\b/gm)].map(
      (m) => m[1]!
    )
  ),
]

export const nameDeclarations = (code: string): string =>
  declaredComponents(code)
    .map(
      (name) =>
        `if (typeof ${name} === 'function' && !${name}.displayName) ${name}.displayName = ${JSON.stringify(name)}`
    )
    .join('\n')

export const storyNames = (): Plugin => ({
  name: 'greese-story-names',
  enforce: 'pre',
  transform(code, id) {
    if (id.includes('?') || !STORY_FILE.test(id)) return
    const names = nameDeclarations(code)
    return names ? { code: `${code}\n${names}\n`, map: null } : undefined
  },
})
