// Streams Playwright results to the dashboard server as prefixed JSON lines
// on stdout, in the same shape as the Vitest reporter's.
import { relative } from 'node:path'

const PREFIX = '@@greese-dash@@'
const root = process.env.GREESE_DASH_ROOT ?? process.cwd()
const emit = (event) => process.stdout.write(`${PREFIX}${JSON.stringify(event)}\n`)
const rel = (file) => relative(root, file)

export default class DashboardReporter {
  printsToStdio() {
    return true
  }

  onBegin(_config, suite) {
    const tests = suite.allTests()
    const perFile = new Map()
    for (const test of tests) {
      const file = rel(test.location.file)
      perFile.set(file, (perFile.get(file) ?? 0) + 1)
    }
    emit({ type: 'run-start', files: perFile.size })
    for (const [file, count] of perFile)
      emit({ type: 'file-collected', file, tests: count })
  }

  onTestEnd(test, result) {
    // A retried test reports once per attempt; only the last attempt counts.
    if (
      result.status !== 'passed' &&
      result.status !== 'skipped' &&
      result.retry < test.retries
    ) {
      return
    }
    const titlePath = test.titlePath().slice(3) // drop root, project and file
    emit({
      type: 'test',
      file: rel(test.location.file),
      title: test.title,
      fullName: titlePath.join(' > '),
      line: test.location.line,
      project: test.parent.project()?.name,
      status: statusOf(test, result),
      duration: result.duration,
      retries: result.retry,
      flaky: test.outcome() === 'flaky',
      errors: result.errors.map((error) => stripAnsi(error.message ?? '')).slice(0, 3),
    })
  }

  onEnd(result) {
    emit({ type: 'run-end', reason: result.status, unhandledErrors: [] })
  }
}

function statusOf(test, result) {
  if (result.status === 'skipped') return 'skipped'
  if (test.outcome() === 'expected' || test.outcome() === 'flaky') return 'passed'
  return 'failed'
}

function stripAnsi(text) {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '')
}
