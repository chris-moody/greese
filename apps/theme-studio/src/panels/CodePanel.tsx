import type { JSX } from 'react'
import { Button, Code, Heading, Stack, Text } from '@greese/react'
import type { ThemeSpec } from '../spec.ts'

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
  outputs,
  spec,
}: {
  scss: string
  css: string
  outputs: string[]
  /** Given in the hosted studio: the theme, offered as files to download. */
  spec?: ThemeSpec
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
    {(
      [
        ['SCSS', scss, 'greese-theme.scss'],
        ['Compiled CSS', css, 'greese-theme.css'],
      ] as const
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
