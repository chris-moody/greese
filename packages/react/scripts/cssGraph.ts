/**
 * Works out which per-component stylesheets each component needs, from its
 * source: the `sauce-*` classes its TSX renders and the components it imports.
 * Used by build-css.ts; pure apart from reading files, and unit-tested.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** `sauce-Button--solid` → `sauce-Button`; `sauce-Dialog-title` stays. */
const CLASS = /sauce-[A-Z][A-Za-z]*(?:-[a-z][A-Za-z]*)?/g
const blockOf = (cls: string) => cls.replace(/^(sauce-[A-Z][A-Za-z]*).*$/, '$1')

export interface ComponentSource {
  name: string
  /** TSX sources, tests excluded. */
  tsx: string
  hasScss: boolean
}

export const readComponents = (componentsDir: string): ComponentSource[] =>
  readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => {
      const dir = join(componentsDir, name)
      const tsx = readdirSync(dir)
        .filter((file) => /\.tsx?$/.test(file) && !/\.test\./.test(file))
        .map((file) => readFileSync(join(dir, file), 'utf8'))
        .join('\n')
      return { name, tsx, hasScss: existsSync(join(dir, `${name}.scss`)) }
    })

/**
 * Which component's stylesheet defines each class: the component named after
 * the class's block if its CSS has it, otherwise the only one that does.
 */
export const ownersOf = (compiled: Map<string, string>): Map<string, string> => {
  const definedIn = new Map<string, Set<string>>()
  for (const [name, css] of compiled) {
    for (const cls of css.match(new RegExp(`\\.${CLASS.source}`, 'g')) ?? []) {
      const key = cls.slice(1)
      if (!definedIn.has(key)) definedIn.set(key, new Set())
      definedIn.get(key)!.add(name)
    }
  }
  const owners = new Map<string, string>()
  for (const [cls, names] of definedIn) {
    const block = blockOf(cls).slice('sauce-'.length)
    owners.set(cls, names.has(block) ? block : [...names].sort()[0]!)
  }
  return owners
}

export interface Dependencies {
  /** Component name → stylesheets it needs (excluding its own). */
  deps: Map<string, string[]>
  /** Classes referenced in TSX whose block no stylesheet defines. */
  unresolved: Array<{ component: string; cls: string }>
}

export const dependenciesOf = (
  components: ComponentSource[],
  compiled: Map<string, string>
): Dependencies => {
  const owners = ownersOf(compiled)
  const withCss = new Set(compiled.keys())
  const deps = new Map<string, string[]>()
  const unresolved: Dependencies['unresolved'] = []

  for (const { name, tsx } of components) {
    const needed = new Set<string>()
    for (const cls of new Set(tsx.match(CLASS) ?? [])) {
      const owner = owners.get(cls) ?? owners.get(blockOf(cls))
      if (owner) needed.add(owner)
      else if (!withCss.has(blockOf(cls).slice('sauce-'.length)))
        unresolved.push({ component: name, cls })
    }
    for (const [, imported] of tsx.matchAll(/from '\.\.\/([A-Za-z]+)\/\1\.tsx'/g)) {
      needed.add(imported!)
    }
    needed.delete(name)
    deps.set(name, [...needed].sort())
  }

  // A component gets a stylesheet if it has styles of its own or needs one
  // that does. Drop dependencies that emit nothing (e.g. Slot).
  const emits = new Map<string, boolean>()
  const emitsFile = (name: string, seen = new Set<string>()): boolean => {
    if (emits.has(name)) return emits.get(name)!
    if (seen.has(name)) return false
    seen.add(name)
    const result =
      withCss.has(name) || (deps.get(name) ?? []).some((dep) => emitsFile(dep, seen))
    emits.set(name, result)
    return result
  }
  for (const [name, list] of deps)
    deps.set(
      name,
      list.filter((dep) => emitsFile(dep))
    )

  return { deps, unresolved }
}
