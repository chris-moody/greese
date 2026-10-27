// Streams Vitest results to the dashboard server as prefixed JSON lines on
// stdout. The prefix keeps them apart from anything the tests themselves log.
import { relative } from 'node:path'

const PREFIX = '@@greese-dash@@'
const root = process.env.GREESE_DASH_ROOT ?? process.cwd()
const emit = (event) => process.stdout.write(`${PREFIX}${JSON.stringify(event)}\n`)
const rel = (file) => relative(root, file.split('?')[0])

export default class DashboardReporter {
  onTestRunStart(specifications) {
    emit({ type: 'run-start', files: specifications.length })
  }

  onTestModuleCollected(module) {
    let tests = 0
    for (const _ of module.children.allTests()) tests++
    emit({ type: 'file-collected', file: rel(module.moduleId), tests })
  }

  onTestCaseResult(test) {
    const result = test.result()
    const diagnostic = test.diagnostic()
    emit({
      type: 'test',
      file: rel(test.module.moduleId),
      title: test.name,
      fullName: test.fullName,
      line: test.location?.line,
      status: result.state,
      duration: round(diagnostic?.duration),
      retries: diagnostic?.retryCount ?? 0,
      flaky: diagnostic?.flaky ?? false,
      errors: (result.errors ?? []).map((error) => error.message).slice(0, 3),
    })
  }

  onTestModuleEnd(module) {
    const diagnostic = module.diagnostic()
    // The modules this test file pulled in: the repo's own files only, with
    // the time each took to import.
    const imports = Object.entries(diagnostic.importDurations ?? {})
      .filter(([file, d]) => !d.external && !file.includes('/node_modules/'))
      .map(([file, d]) => ({
        file: rel(file),
        self: round(d.selfTime),
        total: round(d.totalTime),
      }))
      .filter(
        (entry) => !entry.file.startsWith('..') && entry.file !== rel(module.moduleId)
      )
      .sort((a, b) => b.total - a.total)
    emit({
      type: 'file-end',
      file: rel(module.moduleId),
      state: module.state(),
      duration: round(diagnostic.duration),
      environment: round(diagnostic.environmentSetupDuration),
      prepare: round(diagnostic.prepareDuration),
      collect: round(diagnostic.collectDuration),
      setup: round(diagnostic.setupDuration),
      imports,
    })
  }

  onTestRunEnd(_modules, unhandledErrors, reason) {
    emit({
      type: 'run-end',
      reason,
      unhandledErrors: unhandledErrors.map((error) => error.message),
    })
  }
}

function round(ms) {
  return Math.round((ms ?? 0) * 10) / 10
}
