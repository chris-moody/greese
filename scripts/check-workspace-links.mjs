#!/usr/bin/env node
/**
 * Fails if a registry copy of a workspace package is shadowing the workspace
 * itself.
 *
 * Running `npm install` with the cwd inside `packages/<name>` does not find the
 * root's `workspaces` field, so npm treats that folder as its own project and
 * installs its dependencies from the registry into
 * `packages/<name>/node_modules`. Node and TypeScript both resolve from the
 * nearest `node_modules` up, so that copy wins over the root's symlink — and it
 * is a *published* copy, frozen at whatever the last release contained.
 *
 * The failure that follows is silent and misleading. A type the source clearly
 * exports is reported as missing; a component stylesheet that plainly exists is
 * reported as absent. Nothing names the stale copy, because from the compiler's
 * point of view it is simply the package. These copies are also gitignored, so
 * they are invisible to `git status` and survive every branch switch.
 *
 *   npm run check:links
 */
import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const read = (p) => JSON.parse(readFileSync(p, 'utf8'))

/** Every workspace folder, from the root's `workspaces` globs (one `*` deep). */
const workspaceDirs = read(join(root, 'package.json')).workspaces.flatMap((glob) => {
  const parent = glob.replace(/\/\*$/, '')
  const dir = join(root, parent)
  if (!glob.endsWith('/*')) return existsSync(dir) ? [parent] : []
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'package.json')))
    .map((e) => `${parent}/${e.name}`)
})

/** The names those folders provide — the ones that must never be installed. */
const provided = new Set(
  workspaceDirs.map((d) => read(join(root, d, 'package.json')).name).filter(Boolean)
)

const shadowed = []
for (const dir of workspaceDirs) {
  const modules = join(root, dir, 'node_modules')
  if (!existsSync(modules)) continue
  // A scope is a plain folder; the package inside it is what may be a symlink.
  const candidates = readdirSync(modules)
    .filter((n) => !n.startsWith('.'))
    .flatMap((n) =>
      n.startsWith('@')
        ? readdirSync(join(modules, n)).map((p) => [`${n}/${p}`, join(modules, n, p)])
        : [[n, join(modules, n)]]
    )
  for (const [name, path] of candidates) {
    if (!provided.has(name)) continue
    // A symlink back to the workspace is npm doing the right thing.
    if (lstatSync(path).isSymbolicLink()) continue
    const version = existsSync(join(path, 'package.json'))
      ? read(join(path, 'package.json')).version
      : '?'
    shadowed.push({ dir, name, version, path: `${dir}/node_modules/${name}` })
  }
}

if (shadowed.length === 0) {
  console.log(
    `  ✔ check-workspace-links: no workspace package is shadowed (${provided.size} packages, ${workspaceDirs.length} workspaces).`
  )
  process.exit(0)
}

console.error(
  '\n  check-workspace-links: a registry copy is shadowing a workspace package.\n'
)
for (const s of shadowed) {
  console.error(`    ${s.path}  (published ${s.name}@${s.version})`)
}
console.error(
  [
    '',
    '  Whatever resolves that name gets the published copy, not this repo, so the',
    '  source you are editing is not the source being compiled.',
    '',
    '  Remove them:',
    '',
    `    rm -rf ${shadowed.map((s) => s.path).join(' ')}`,
    '',
    '  They appear when `npm install` runs with the cwd inside a workspace folder.',
    '  Install from the repo root instead, with `-w <package>` to pick the target:',
    '',
    '    npm install --save-dev <dep> -w @greese/react',
    '',
  ].join('\n')
)
process.exit(1)
