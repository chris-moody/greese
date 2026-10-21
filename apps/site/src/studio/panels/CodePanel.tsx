import type { JSX } from 'react'
import { Button, Code, Heading, Stack, Text } from '@greese/react'
import type { ThemeSpec } from '../spec.ts'

const BUILT_IN = ['xs', 'sm', 'md', 'lg', 'xl']
const extras = (list: Array<[string, number]>) =>
  list.filter(([key]) => !BUILT_IN.includes(key))

/** What an app needs besides the CSS: the values for JavaScript, the keys for TypeScript. */
const appSnippet = (list: Array<[string, number]>): string => {
  const values = list
    .filter(([key]) => key !== 'xs')
    .map(([key, width]) => `${/^\d/.test(key) ? `'${key}'` : key}: ${width}`)
    .join(', ')
  const added = extras(list)
  return [
    "import { configureBreakpoints } from '@greese/react'",
    `configureBreakpoints({ ${values} }) // before the first render`,
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

/** Saves text as a file, for the hosted studio, which can't write to disk. */
const download = (name: string, text: string) => {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

export const CodePanel = ({
  scss,
  css,
  effects,
  outputs,
  spec,
  breakpoints,
}: {
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
          <code>npm run studio</code>, and use the SCSS in an app that compiles Sass, or
          import the CSS after GreeseUI’s styles.
        </Text>
        <div>
          <Button
            size="sm"
            variant="soft"
            tone="neutral"
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
        Saving writes {outputs.length ? outputs.join(' and ') : 'these'} next to the theme
        file. Use the SCSS in an app that compiles Sass, or import the CSS after
        GreeseUI’s styles.
      </Text>
    )}
    {breakpoints && (
      <Stack gap={2}>
        <Heading level={3} variant="h6">
          Breakpoints
        </Heading>
        <Text variant="p3" tone="muted">
          The compiled CSS below is the whole stylesheet, built for these breakpoints: use
          it in place of <code>styles.css</code>. Tell the JavaScript the same
          {extras(breakpoints).length ? ', and TypeScript about the keys you added' : ''}:
        </Text>
        <Code block className="studio-code">
          {appSnippet(breakpoints)}
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
    {(
      [
        ['SCSS', scss, 'greese-theme.scss'] as const,
        ['Compiled CSS', css, 'greese-theme.css'] as const,
        ...(effects
          ? [['Effects (TypeScript)', effects, 'greese-theme.effects.ts']]
          : []),
      ] as ReadonlyArray<readonly [title: string, text: string, name: string]>
    ).map(([title, text, name]) => (
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
                onClick={() => download(name, text)}
              >
                Download
              </Button>
            )}
            <Button
              size="sm"
              variant="soft"
              tone="neutral"
              onClick={() => void navigator.clipboard.writeText(text)}
            >
              Copy
            </Button>
          </Stack>
        </Stack>
        <Code block className="studio-code">
          {text || '/* Nothing yet: the theme changes nothing. */'}
        </Code>
      </Stack>
    ))}
  </Stack>
)
