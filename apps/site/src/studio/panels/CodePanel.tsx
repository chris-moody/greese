import { useState, type JSX } from 'react'
import { Button, Code, Field, Heading, Select, Stack, Text } from '@greese/react'
import { DownloadIcon } from '@greese/icons'
import { Highlighted, type CodeLanguage as Language } from '@greese/authoring'
import type { ThemeSpec } from '../spec.ts'
import { zip } from '../zip.ts'

const BUILT_IN = ['xs', 'sm', 'md', 'lg', 'xl']
const extras = (list: Array<[string, number]>) =>
  list.filter(([key]) => !BUILT_IN.includes(key))

/**
 * What an app needs besides the CSS: the JavaScript reads the breakpoints
 * from the stylesheet, and TypeScript needs the keys you added.
 */
const appSnippet = (list: Array<[string, number]>): string => {
  const added = extras(list)
  return [
    "import { configureBreakpoints } from '@greese/react'",
    "configureBreakpoints() // before the first render, once the CSS has loaded: it reads the stylesheet's",
    ...(added.length
      ? [
          '',
          "declare module '@greese/ui' {",
          `  interface BreakpointKeys { ${added.map(([key]) => `${/^\d/.test(key) ? `'${key}'` : key}: true`).join('; ')} }`,
          '}',
        ]
      : []),
  ].join('\n')
}

/** Saves a file, for the hosted studio, which can't write to disk. */
const download = (name: string, content: string | Uint8Array<ArrayBuffer>) => {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(
    new Blob([content], {
      type: typeof content === 'string' ? 'text/plain' : 'application/zip',
    })
  )
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

const copy = (text: string) => void navigator.clipboard.writeText(text)

/**
 * The SCSS layout (ADR 0034), a file at a time: the theme as a folder of
 * modules, the studio's default output, to keep in your source and edit a
 * part at a time.
 */
const Layout = ({
  files,
  folder,
  hosted,
}: {
  files: Record<string, string>
  folder: string
  hosted: boolean
}): JSX.Element => {
  const paths = Object.keys(files).sort((a, b) =>
    a === 'main.scss' ? -1 : b === 'main.scss' ? 1 : a.localeCompare(b)
  )
  const [chosen, setChosen] = useState('main.scss')
  const path = files[chosen] === undefined ? paths[0]! : chosen
  return (
    <Stack gap={2}>
      <Stack direction="row" justify="between" align="center" gap={2}>
        <Heading level={3} variant="h6">
          SCSS layout
        </Heading>
        <Stack direction="row" gap={2}>
          {hosted && (
            <Button
              size="sm"
              variant="soft"
              tone="neutral"
              startIcon={<DownloadIcon />}
              onClick={() => download(`${folder}.zip`, zip(files, folder))}
            >
              Download .zip
            </Button>
          )}
          <Button
            size="sm"
            variant="soft"
            tone="neutral"
            onClick={() => copy(files[path]!)}
          >
            Copy
          </Button>
        </Stack>
      </Stack>
      <Text variant="p3" tone="muted">
        A module per component, token group and concern, under <code>{folder}/</code>:
        compile <code>main.scss</code> after greese ui’s styles. Each file is yours to
        edit; delete its first line and saving leaves it alone.
      </Text>
      <Field label="File">
        <Select size="sm" value={path} onChange={(e) => setChosen(e.currentTarget.value)}>
          {paths.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </Field>
      <Code block className="studio-code studio-highlighted">
        <Highlighted language="scss" value={files[path]!} />
      </Code>
    </Stack>
  )
}

export const CodePanel = ({
  layout,
  folder,
  scss,
  css,
  effects,
  outputs,
  spec,
  breakpoints,
}: {
  /** The SCSS layout, by path in its folder. */
  layout: Record<string, string>
  /** The layout's folder: the theme file's name. */
  folder: string
  scss: string
  css: string
  /** The theme's effects as a module, while it has any. */
  effects?: string
  outputs: string[]
  /** Given in the hosted studio: the theme, offered as files to download. */
  spec?: ThemeSpec
  /** The theme's own breakpoints, when it has any: the app needs to know them too. */
  breakpoints?: Array<[string, number]>
}): JSX.Element => (
  <Stack gap={5}>
    {spec ? (
      <Stack gap={3}>
        <Text variant="p3" tone="muted">
          This studio keeps the theme in your browser. Download{' '}
          <code>greese-theme.json</code> to keep editing it locally with{' '}
          <code>npm run studio</code>. Keep the SCSS layout in an app that compiles Sass,
          or import the CSS after greese ui’s styles.
        </Text>
        <div>
          <Button
            size="sm"
            variant="soft"
            tone="neutral"
            startIcon={<DownloadIcon />}
            onClick={() =>
              download('greese-theme.json', `${JSON.stringify(spec, null, 2)}\n`)
            }
          >
            Download greese-theme.json
          </Button>
        </div>
      </Stack>
    ) : (
      <Text variant="p3" tone="muted">
        Saving writes {outputs.length ? outputs.join(', ') : 'these'} next to the theme
        file (choose with <code>GREESE_THEME_OUTPUT</code>: <code>layout</code>,{' '}
        <code>scss</code>, <code>css</code>). Keep the SCSS layout in an app that compiles
        Sass, or import the CSS after greese ui’s styles.
      </Text>
    )}
    {breakpoints && (
      <Stack gap={2}>
        <Heading level={3} variant="h6">
          Breakpoints
        </Heading>
        <Text variant="p3" tone="muted">
          The compiled CSS below is the whole stylesheet, built for these breakpoints: use
          it in place of <code>styles.css</code> (the SCSS layout builds the utility
          classes with them too). Let the JavaScript read them from it
          {extras(breakpoints).length
            ? ', and tell TypeScript about the keys you added'
            : ''}
          :
        </Text>
        <Code block className="studio-code studio-highlighted">
          <Highlighted language="ts" value={appSnippet(breakpoints)} />
        </Code>
      </Stack>
    )}
    {effects && (
      <Text variant="p3" tone="muted">
        The theme has effects. Import <code>greese-theme.effects.ts</code> once at your
        app’s entry so the runtime knows them; the CSS above already carries any retuned
        entrance preset’s keyframes.
      </Text>
    )}
    <Layout files={layout} folder={folder} hosted={!!spec} />
    {(
      [
        ['SCSS, one file', scss, 'greese-theme.scss', 'scss'] as const,
        ['Compiled CSS', css, 'greese-theme.css', 'css'] as const,
        ...(effects
          ? [['Effects (TypeScript)', effects, 'greese-theme.effects.ts', 'ts']]
          : []),
      ] as ReadonlyArray<
        readonly [title: string, text: string, name: string, language: Language]
      >
    ).map(([title, text, name, language]) => (
      <Stack gap={2} key={title}>
        <Stack direction="row" justify="between" align="center" gap={2}>
          <Heading level={3} variant="h6">
            {title}
          </Heading>
          <Stack direction="row" gap={2}>
            {spec && (
              <Button
                size="sm"
                variant="soft"
                tone="neutral"
                startIcon={<DownloadIcon />}
                onClick={() => download(name, text)}
              >
                Download
              </Button>
            )}
            <Button size="sm" variant="soft" tone="neutral" onClick={() => copy(text)}>
              Copy
            </Button>
          </Stack>
        </Stack>
        <Code block className="studio-code studio-highlighted">
          <Highlighted
            language={language}
            value={text || '/* Nothing yet: the theme changes nothing. */'}
          />
        </Code>
      </Stack>
    ))}
  </Stack>
)
