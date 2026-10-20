import type { JSX } from 'react'
import { Button, Code, Heading, Stack, Text } from '@greese-ui/react'

export const CodePanel = ({
  scss,
  css,
  outputs,
}: {
  scss: string
  css: string
  outputs: string[]
}): JSX.Element => (
  <Stack gap={5}>
    <Text size="sm" tone="muted">
      Saving writes {outputs.length ? outputs.join(' and ') : 'these'} next to the theme
      file. Use the SCSS in an app that compiles Sass, or import the CSS after GreeseUI’s
      styles.
    </Text>
    {(
      [
        ['SCSS', scss],
        ['Compiled CSS', css],
      ] as const
    ).map(([title, text]) => (
      <Stack gap={2} key={title}>
        <Stack direction="row" justify="between" align="center">
          <Heading level={3} size="md">
            {title}
          </Heading>
          <Button
            size="sm"
            variant="soft"
            tone="neutral"
            onClick={() => void navigator.clipboard.writeText(text)}
          >
            Copy
          </Button>
        </Stack>
        <Code block className="studio-code">
          {text || '/* Nothing yet: the theme changes nothing. */'}
        </Code>
      </Stack>
    ))}
  </Stack>
)
