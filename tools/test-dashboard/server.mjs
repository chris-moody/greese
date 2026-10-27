// The test dashboard: a local, dependency-free server that runs the repo's
// existing Vitest and Playwright suites one at a time, streams their progress
// to the page over server-sent events, and keeps each run's report as JSON.
//
//   npm run test:dashboard            then open http://localhost:4410
//
// It lives outside the npm workspaces, so no build or publish ever sees it.
// It only listens on localhost and only runs the suites listed in SUITES.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const reportsDir = join(here, 'reports')
const port = Number(process.env.PORT ?? 4410)
const PREFIX = '@@greese-dash@@'

const vitest = (cwd) => ({
  kind: 'unit',
  cwd,
  command: 'npx',
  args: [
    'vitest',
    'run',
    `--reporter=${join(here, 'reporters/vitest.mjs')}`,
    '--includeTaskLocation',
    '--experimental.importDurations.limit=1000',
  ],
})
const playwright = (cwd, ...extra) => ({
  kind: 'e2e',
  cwd,
  command: 'npx',
  args: [
    'playwright',
    'test',
    ...extra,
    `--reporter=${join(here, 'reporters/playwright.mjs')}`,
  ],
})

/** Every suite the repo has, as CI runs it (ADR 0006, the greese-verify skill). */
const SUITES = [
  { id: 'unit:ui', label: '@greese/ui unit', ...vitest('packages/ui'), default: true },
  {
    id: 'unit:react',
    label: '@greese/react unit',
    ...vitest('packages/react'),
    default: true,
  },
  { id: 'unit:js', label: '@greese/js unit', ...vitest('packages/js'), default: true },
  {
    id: 'unit:icons',
    label: '@greese/icons unit',
    ...vitest('packages/icons'),
    default: true,
  },
  { id: 'unit:mcp', label: '@greese/mcp unit', ...vitest('packages/mcp'), default: true },
  { id: 'unit:site', label: 'site unit', ...vitest('apps/site'), default: true },
  {
    id: 'e2e:playground',
    label: 'playground e2e (5 browsers)',
    ...playwright('apps/playground'),
    default: false,
  },
  { id: 'e2e:site', label: 'site e2e', ...playwright('apps/site'), default: false },
  {
    id: 'visual',
    label: 'visual regression (needs docs build)',
    ...playwright('apps/playground', '-c', 'playwright.visual.config.ts'),
    default: false,
  },
]
const BUILD = {
  id: 'build',
  label: 'build packages (turbo)',
  kind: 'build',
  cwd: '.',
  command: 'npx',
  args: ['turbo', 'run', 'build', '--filter=./packages/*'],
}

let run = null // the run in progress, or the last one
let child = null
const clients = new Set()

function broadcast(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`
  for (const res of clients) res.write(data)
}

function newSuiteRecord(suite) {
  return {
    id: suite.id,
    label: suite.label,
    kind: suite.kind,
    cwd: suite.cwd,
    command: [
      suite.command,
      ...suite.args.map((a) => a.replace(here, '<dashboard>')),
    ].join(' '),
    status: 'queued',
    startedAt: null,
    wall: 0,
    expectedTests: 0,
    files: {},
    tests: [],
    log: '',
    exitCode: null,
    unhandledErrors: [],
  }
}

function fileRecord(suite, file) {
  suite.files[file] ??= {
    file,
    tests: 0,
    imports: [],
    fixtures: e2eFixtures(suite, file),
  }
  return suite.files[file]
}

/** What an e2e spec drives: the playground pages it opens and what it imports. */
function e2eFixtures(suite, file) {
  if (suite.kind !== 'e2e') return []
  let source
  try {
    source = readFileSync(join(root, file), 'utf8')
  } catch {
    return []
  }
  const found = new Set()
  for (const [, page] of source.matchAll(/\?page=([a-z-]+)/gi)) {
    const name = page.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
    found.add(join(suite.cwd, 'src/pages', `${name}.tsx`))
  }
  for (const [, html] of source.matchAll(/goto\(['"`]\/([\w-]+\.html)/g)) {
    found.add(join(suite.cwd, html))
  }
  for (const [, spec] of source.matchAll(/from ['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const base = join(dirname(file), spec)
    const hit = ['', '.ts', '.tsx', '/index.ts'].map((ext) => base + ext).find(isFile)
    if (hit) found.add(hit)
  }
  return [...found].filter(isFile)
}

function isFile(path) {
  return existsSync(join(root, path))
}

function handleEvent(suite, event) {
  switch (event.type) {
    case 'file-collected':
      fileRecord(suite, event.file).tests = event.tests
      suite.expectedTests = Object.values(suite.files).reduce((n, f) => n + f.tests, 0)
      break
    case 'test':
      suite.tests.push(event)
      break
    case 'file-end':
      Object.assign(fileRecord(suite, event.file), event, {
        tests: suite.files[event.file].tests,
      })
      break
    case 'run-end':
      suite.unhandledErrors = event.unhandledErrors ?? []
      break
  }
  broadcast({ type: 'suite-event', suite: suite.id, event })
}

function runSuite(suite, record) {
  return new Promise((done) => {
    record.status = 'running'
    record.startedAt = Date.now()
    broadcast({ type: 'suite-start', suite: record.id, record: summary(record) })
    child = spawn(suite.command, suite.args, {
      cwd: join(root, suite.cwd),
      env: { ...process.env, GREESE_DASH_ROOT: root, FORCE_COLOR: '0' },
      // Its own process group, so stopping kills npx and everything under it.
      detached: true,
    })
    let buffer = ''
    const onData = (chunk) => {
      buffer += chunk
      let newline
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline)
        buffer = buffer.slice(newline + 1)
        const at = line.indexOf(PREFIX)
        if (at >= 0) {
          try {
            handleEvent(record, JSON.parse(line.slice(at + PREFIX.length)))
          } catch {
            /* a partial line from interleaved output: ignore */
          }
        } else if (record.log.length < 200_000) {
          record.log += line + '\n'
          broadcast({ type: 'log', suite: record.id, line })
        }
      }
    }
    child.stdout.setEncoding('utf8').on('data', onData)
    child.stderr.setEncoding('utf8').on('data', onData)
    child.on('close', (code) => {
      child = null
      record.exitCode = code
      record.wall = Date.now() - record.startedAt
      const failed = record.tests.some((t) => t.status === 'failed')
      record.status = run.stopped
        ? 'stopped'
        : code === 0
          ? 'passed'
          : failed
            ? 'failed'
            : 'error'
      broadcast({ type: 'suite-end', suite: record.id, record: summary(record) })
      done()
    })
  })
}

function summary(record) {
  const { log, tests, files, ...rest } = record
  return rest
}

async function startRun({ suites: ids, build }) {
  const chosen = SUITES.filter((s) => ids.includes(s.id))
  const plan = build ? [BUILD, ...chosen] : chosen
  run = {
    id: new Date().toISOString().replace(/[:.]/g, '-'),
    startedAt: Date.now(),
    finishedAt: null,
    wall: 0,
    stopped: false,
    status: 'running',
    suites: plan.map(newSuiteRecord),
  }
  broadcast({ type: 'run-start', run: { ...run, suites: run.suites.map(summary) } })
  for (const [i, suite] of plan.entries()) {
    if (run.stopped) {
      run.suites[i].status = 'skipped'
      continue
    }
    await runSuite(suite, run.suites[i])
  }
  run.finishedAt = Date.now()
  run.wall = run.finishedAt - run.startedAt
  run.status = run.stopped
    ? 'stopped'
    : run.suites.every((s) => s.status === 'passed' || s.status === 'skipped')
      ? 'passed'
      : 'failed'
  mkdirSync(reportsDir, { recursive: true })
  writeFileSync(join(reportsDir, `${run.id}.json`), JSON.stringify(run))
  broadcast({ type: 'run-end', id: run.id, status: run.status })
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' })
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body))
}

function readBody(req) {
  return new Promise((ok) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        ok(JSON.parse(body || '{}'))
      } catch {
        ok({})
      }
    })
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const route = `${req.method} ${url.pathname}`

  if (route === 'GET /')
    return send(res, 200, readFileSync(join(here, 'index.html')), 'text/html')

  if (route === 'GET /api/suites') {
    return send(
      res,
      200,
      SUITES.map(({ id, label, kind, cwd, default: on }) => ({
        id,
        label,
        kind,
        cwd,
        default: on,
      }))
    )
  }

  if (route === 'GET /api/events') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    })
    res.write(': connected\n\n')
    clients.add(res)
    req.on('close', () => clients.delete(res))
    return
  }

  if (route === 'POST /api/run') {
    if (run?.status === 'running')
      return send(res, 409, { error: 'A run is in progress' })
    // Only same-origin pages may start runs.
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) {
      return send(res, 403, { error: 'Forbidden' })
    }
    const body = await readBody(req)
    const ids = Array.isArray(body.suites)
      ? body.suites.filter((id) => typeof id === 'string')
      : []
    if (!ids.length) return send(res, 400, { error: 'Pick at least one suite' })
    startRun({ suites: ids, build: body.build === true })
    return send(res, 202, { ok: true })
  }

  if (route === 'POST /api/stop') {
    if (run?.status === 'running') {
      run.stopped = true
      killChild()
    }
    return send(res, 200, { ok: true })
  }

  if (route === 'GET /api/current') return send(res, 200, run ?? null)

  if (route === 'GET /api/reports') {
    const ids = existsSync(reportsDir)
      ? readdirSync(reportsDir)
          .filter((f) => f.endsWith('.json'))
          .map((f) => f.slice(0, -5))
          .sort()
          .reverse()
      : []
    return send(res, 200, ids)
  }

  const report = url.pathname.match(/^\/api\/reports\/([\w-]+)$/)
  if (req.method === 'GET' && report) {
    const file = join(reportsDir, `${report[1]}.json`)
    return existsSync(file)
      ? send(res, 200, readFileSync(file))
      : send(res, 404, { error: 'No such report' })
  }

  send(res, 404, { error: 'Not found' })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Test dashboard: http://localhost:${port}`)
})

function killChild() {
  if (!child) return
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    child.kill('SIGTERM')
  }
}

function shutdown() {
  killChild()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
