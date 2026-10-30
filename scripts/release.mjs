#!/usr/bin/env node
/**
 * Releases the @greese packages from this machine, in one command:
 *
 *   npm run release              version, check, publish, push, GitHub releases
 *   npm run release -- --dry-run version and check only: nothing is committed,
 *                                published or pushed (the versioning is undone)
 *   npm run release -- --otp=123456   an npm one-time password, when the
 *                                account has 2FA for publishing
 *
 * Versions and changelogs come from the pending changesets (.changeset/*.md):
 * each says which packages change and whether as a major, minor or patch, and
 * its text becomes the package's CHANGELOG.md entry. `changeset version`
 * applies them; `changeset publish` publishes every package whose version
 * isn't on npm yet and tags it (`@greese/react@1.1.0`). With no pending
 * changesets, it publishes only what's versioned but unpublished.
 *
 * Steps, each of which stops the release if it fails:
 *   1. Preflight: on main, a clean tree, up to date with origin, logged in to
 *      npm and to GitHub (gh).
 *   2. Version: apply the changesets, sync package-lock.json.
 *   3. Gates: build, types, lint, format, unit tests, size, verify:packages.
 *   4. Commit `chore(release): version packages`.
 *   5. Publish to npm, which tags each published package.
 *   6. Push main and the tags; a GitHub release per tag, from its changelog.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const otp = args.find((a) => a.startsWith('--otp='))?.slice(6)

/** Runs a command, its output shown; fails the release if it fails. */
const run = (cmd, cmdArgs, { env } = {}) => {
  console.log(`\n$ ${[cmd, ...cmdArgs].join(' ')}`)
  const result = spawnSync(cmd, cmdArgs, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })
  if (result.status !== 0) fail(`${cmd} ${cmdArgs.join(' ')} failed`)
}

/** A command's output, trimmed; null if it fails. */
const read = (cmd, cmdArgs) => {
  try {
    return execFileSync(cmd, cmdArgs, {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim()
  } catch {
    return null
  }
}

const fail = (message) => {
  console.error(`\n✖ release stopped: ${message}`)
  process.exit(1)
}

const step = (title) => console.log(`\n▶ ${title}`)

const PACKAGES = readdirSync(join(root, 'packages'))
  .map((dir) => join(root, 'packages', dir))
  .filter((dir) => existsSync(join(dir, 'package.json')))
  .map((dir) => ({
    dir,
    json: JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')),
  }))
  .filter(({ json }) => !json.private)

const pending = () =>
  readdirSync(join(root, '.changeset')).filter(
    (f) => f.endsWith('.md') && f !== 'README.md'
  )

// 1. Preflight.
step('Preflight')
if (read('git', ['branch', '--show-current']) !== 'main') fail('not on main')
if (read('git', ['status', '--porcelain']))
  fail('the working tree has changes: commit or stash them')
if (!read('git', ['remote', 'get-url', 'origin'])) fail('no `origin` remote to push to')
if (!dryRun) {
  run('git', ['fetch', 'origin', 'main', '--tags'])
  if (read('git', ['rev-list', '--count', 'HEAD..origin/main']) !== '0')
    fail('origin/main has commits this branch lacks: pull first')
  const user = read('npm', ['whoami'])
  if (!user) fail('not logged in to npm: run `npm login`')
  console.log(`npm: ${user}`)
  if (read('gh', ['auth', 'status']) === null)
    fail('not logged in to GitHub: run `gh auth login`')
}

// 2. Version.
step(`Version (${pending().length} pending changesets)`)
if (pending().length) {
  run('npx', ['changeset', 'version'])
  // Internal dependencies moved with the versions: the lockfile follows.
  run('npm', ['install', '--package-lock-only', '--no-audit', '--no-fund'])
}
for (const { dir, json } of PACKAGES) {
  const { version } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const published = read('npm', ['view', `${json.name}@${version}`, 'version'])
  console.log(`  ${json.name}@${version}${published ? ' (on npm)' : ' → to publish'}`)
}

// 3. Gates: what CI runs, minus the browser tests (run those before releasing:
// npm run test:e2e, npm run test:visual).
step('Gates')
for (const script of [
  'build',
  'check-types',
  'lint',
  'format:check',
  'test',
  'size',
  'verify:packages',
])
  run('npm', ['run', script])

if (dryRun) {
  step('Dry run: undoing the versioning')
  run('git', ['checkout', '--', '.'])
  run('git', ['clean', '-fd', '--', '.changeset'])
  console.log('\n✔ dry run passed: `npm run release` would publish the versions above')
  process.exit(0)
}

// 4. Commit.
step('Commit')
if (read('git', ['status', '--porcelain'])) {
  run('git', ['add', '-A', '--', '.changeset', 'package-lock.json', 'packages'])
  run('git', ['commit', '-m', 'chore(release): version packages'])
}

// 5. Publish: every package whose version isn't on npm, tagged.
step('Publish to npm')
const tagsBefore = new Set(read('git', ['tag'])?.split('\n'))
run('npx', ['changeset', 'publish', ...(otp ? ['--otp', otp] : [])])
const tags = (read('git', ['tag'])?.split('\n') ?? []).filter(
  (t) => t && !tagsBefore.has(t)
)
if (!tags.length) {
  console.log('Nothing new to publish.')
  process.exit(0)
}

// 6. Push and GitHub releases.
step('Push and GitHub releases')
run('git', ['push', 'origin', 'main', '--follow-tags'])
for (const tag of tags) {
  const at = tag.lastIndexOf('@')
  const name = tag.slice(0, at)
  const version = tag.slice(at + 1)
  const pkg = PACKAGES.find(({ json }) => json.name === name)
  const changelog = pkg && join(pkg.dir, 'CHANGELOG.md')
  // The version's section of its changelog: from its heading to the next.
  const notes =
    (changelog &&
      existsSync(changelog) &&
      readFileSync(changelog, 'utf8')
        .split(/^## /m)
        .find((section) => section.startsWith(`${version}\n`))
        ?.slice(version.length + 1)
        .trim()) ||
    `${name} ${version}`
  run('gh', [
    'release',
    'create',
    tag,
    '--title',
    tag,
    '--notes',
    notes,
    ...(/-/.test(version) ? ['--prerelease'] : []),
  ])
}
console.log(`\n✔ released ${tags.join(', ')}`)
