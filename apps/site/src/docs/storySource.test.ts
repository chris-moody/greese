/**
 * "Show code" is code that runs: a story that keeps state shows its source as
 * a complete module (apps/docs/.storybook/storySource.ts), and that module
 * type-checks on its own, every hook imported and every setter declared. No
 * story stands in for a callback with a do-nothing function.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { functionArgs, storySources } from '../../../docs/.storybook/storySource.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
const STORIES = join(ROOT, 'apps/docs/stories')

const files = readdirSync(STORIES, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.stories.tsx'))
  .map((f) => join(STORIES, f))

const options: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  lib: ['lib.es2023.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  allowImportingTsExtensions: true,
  skipLibCheck: true,
  types: [],
}

describe('storySources', () => {
  const code = `
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button, Stack, Text } from '@greese/react'

const label = (n: number) => \`Clicked \${n} times\`

const meta = { title: 'X', component: Button, args: { size: 'sm' } } satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Plain: Story = { args: { children: 'Hi' } }

export const Counter: Story = {
  args: { tone: 'primary' },
  render: function Counter(args) {
    const [n, setN] = useState(0)
    return (
      <Stack>
        <Button {...args} onClick={() => setN(n + 1)}>Add</Button>
        <Text>{label(n)}</Text>
      </Stack>
    )
  },
}
`
  it('writes a stateful story as a module: its imports, helpers, args and render', () => {
    const out = storySources(code)
    expect(Object.keys(out)).toEqual(['Counter'])
    expect(out.Counter).toBe(`import { useState } from 'react'
import { Button, Stack, Text } from '@greese/react'

const label = (n: number) => \`Clicked \${n} times\`

export const Counter = () => {
  const args = { size: 'sm', tone: 'primary' } as const
  const [n, setN] = useState(0)
  return (
    <Stack>
      <Button {...args} onClick={() => setN(n + 1)}>Add</Button>
      <Text>{label(n)}</Text>
    </Stack>
  )
}`)
  })

  it('finds function args, by the path that reaches them', () => {
    expect(
      functionArgs(`const meta = { args: { onAction: () => go('x'), label: 'Go' } }`)
    ).toEqual({ 'meta.args.onAction': "() => go('x')" })
  })
})

describe('the stories', () => {
  it('never pass a do-nothing callback', () => {
    const placeholders = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => ({ line, at: i + 1 }))
        .filter(({ line }) => /\bon[A-Z]\w*(?:: |=\{)\(\) => \{\}/.test(line))
        .map(({ at, line }) => `${file.slice(STORIES.length + 1)}:${at} ${line.trim()}`)
    )
    expect(placeholders).toEqual([])
  })

  it('show code that type-checks on its own when they keep state', () => {
    const sources = new Map<string, string>()
    for (const file of files)
      for (const [name, snippet] of Object.entries(
        storySources(readFileSync(file, 'utf8'), file)
      ))
        // Beside its story, so its relative imports resolve as written.
        sources.set(
          join(
            dirname(file),
            `__${file.split('/').pop()!.split('.')[0]}.${name}.snippet.tsx`
          ),
          snippet
        )
    expect(sources.size).toBeGreaterThan(15)

    const host = ts.createCompilerHost(options)
    const read = host.readFile
    host.readFile = (path) => sources.get(path) ?? read(path)
    const exists = host.fileExists
    host.fileExists = (path) => sources.has(path) || exists(path)
    const program = ts.createProgram([...sources.keys()], options, host)
    const wrong = ts
      .getPreEmitDiagnostics(program)
      .filter((d) => d.file && sources.has(d.file.fileName))
      .map((d) => {
        const at = d.file!.getLineAndCharacterOfPosition(d.start ?? 0).line
        return `${d.file!.fileName.slice(STORIES.length + 1)} TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}\n    ${d.file!.text.split('\n')[at]!.trim()}`
      })
    expect(wrong).toEqual([])
  }, 60_000)
})
