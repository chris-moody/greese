import { useEffect, useMemo, useState, type JSX } from 'react'
import { Badge, Button, Checkbox, Heading, Popover, Stack, Text } from '@greese/react'
import { CodeEditor } from '../../../../docs/stories/_shared/code/CodeEditor.tsx'
import { setIn } from '../edit.ts'
import { familyOf } from '../family.ts'
import { familySource } from '../copySource.ts'
import { blocks } from '../manifest.ts'
import {
  AUTHORING_ENTRIES,
  rewriteLibraryUrls,
  splitScss,
  toggleImport,
  type ErrorAt,
} from '../scssModule.ts'
import type { ThemeSpec } from '../spec.ts'

/** The library's component stylesheets as text, loaded the first time a Styles box opens. */
let sources: Promise<Record<string, string>> | undefined
const loadSources = () =>
  (sources ??= import('virtual:greese-stylesheet').then((m) => m.default))

/** What the imports menu offers: the library's entry points, then Sass's own modules. */
const IMPORTS = [
  ...AUTHORING_ENTRIES.map((entry) => `pkg:@greese/ui/scss/${entry}`),
  ...['map', 'list', 'math', 'string', 'color', 'meta'].map((name) => `sass:${name}`),
]

/**
 * The SCSS of a component and everything it contains or is built on, in one
 * box: Accordion, its AccordionItem and the Collapsible inside each.
 *
 * It starts as the library's own SCSS for the family (`familySource`). The
 * theme keeps nothing until you edit it; then it keeps the whole text and
 * writes it inside `component(<Name>)`, so it applies under the component's
 * class only (`.greese-Accordion .greese-Collapsible-trigger`). A Collapsible
 * or an AccordionItem used on its own keeps the library's styles, or its own
 * box's.
 */
export const FamilyStyles = ({
  spec,
  onChange,
  component,
  errorAt,
}: {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  component: string
  /** The last compile error, when it is in this component's SCSS. */
  errorAt?: ErrorAt
}): JSX.Element => {
  const rootClass = blocks[component]?.className ?? `greese-${component}`
  const [family, setFamily] = useState<string[]>([component])
  const [initial, setInitial] = useState<string>()
  const [rewritten, setRewritten] = useState<string[]>([])
  const stored = spec.components?.[component]?.scss

  useEffect(() => {
    let current = true
    setInitial(undefined)
    setRewritten([])
    void Promise.all([familyOf(component), loadSources()]).then(([names, files]) => {
      if (!current) return
      const sheets = [...new Set(names.map((name) => blocks[name]!.stylesheet))]
        .map((sheet) => `src/components/${sheet}/${sheet}.scss`)
        .flatMap((path): Array<[string, string]> => {
          const text = files[`/${path}`]
          return text ? [[path, text]] : []
        })
      setFamily(names)
      setInitial(
        familySource(
          sheets,
          rootClass,
          names.map((name) => blocks[name]!.className)
        )
      )
    })
    return () => {
      current = false
    }
  }, [component, rootClass])

  const text = stored ?? initial ?? ''
  /** Stored only once it differs from the library's own, which applies anyway. */
  const set = (value: string) =>
    onChange(
      setIn(
        spec,
        ['components', component, 'scss'],
        value === initial || !value.trim() ? undefined : value
      )
    )
  const edit = (value: string) => {
    const result = rewriteLibraryUrls(value)
    setRewritten(result.rewritten)
    set(result.text)
  }
  const imported = useMemo(() => new Set(splitScss(text).uses.map((u) => u.url)), [text])
  const scssError = errorAt?.component === component ? errorAt : undefined

  return (
    <Stack gap={2}>
      <Heading level={3} variant="h6">
        Styles
      </Heading>
      <Text variant="p3" tone="muted">
        The library’s SCSS for <code>.{rootClass}</code> and everything it contains or is
        built on, in one box. Edit anything: once changed, the whole box applies inside{' '}
        <code>.{rootClass}</code> only, so these components used elsewhere keep their own
        styles. <code>&amp;</code> is the component; the theme file writes the{' '}
        <code>@use</code> lines once, at the top. Your copy won’t follow later library
        changes.
      </Text>
      <div className="studio-family">
        {family.map((name) => (
          <div key={name} className="studio-family-block">
            <Badge tone={name === component ? 'primary' : 'neutral'} variant="soft">
              {name}
            </Badge>
            <code>.{blocks[name]!.className}</code>
            {blocks[name]!.parts.map((part) => (
              <code key={part}>-{part}</code>
            ))}
          </div>
        ))}
      </div>
      <Stack direction="row" gap={2} align="center" wrap="wrap">
        <Popover
          label="Imports"
          placement="bottom-start"
          trigger={
            <Button
              size="sm"
              variant="outline"
              tone="neutral"
              disabled={initial === undefined}
            >
              Imports ({IMPORTS.filter((url) => imported.has(url)).length})
            </Button>
          }
        >
          <Stack gap={2} className="studio-imports">
            {IMPORTS.map((url) => (
              <Checkbox
                key={url}
                checked={imported.has(url)}
                onCheckedChange={(on) => set(toggleImport(text, url, on))}
                label={
                  <code>
                    {url}
                    {url.endsWith('/kit') ? ' as greese' : ''}
                  </code>
                }
              />
            ))}
          </Stack>
        </Popover>
        {stored !== undefined && (
          <Button
            size="sm"
            variant="ghost"
            tone="neutral"
            onClick={() => {
              setRewritten([])
              onChange(setIn(spec, ['components', component, 'scss'], undefined))
            }}
          >
            Reset {component} styles
          </Button>
        )}
        {stored !== undefined && (
          <Badge tone="primary" variant="soft">
            Edited
          </Badge>
        )}
      </Stack>
      <CodeEditor
        language="scss"
        aria-label={`${component} styles, SCSS`}
        rows={Math.min(40, Math.max(8, text.split('\n').length + 1))}
        invalid={!!scssError}
        markLine={scssError?.line}
        disabled={initial === undefined}
        value={initial === undefined && stored === undefined ? 'Loading…' : text}
        onChange={edit}
      />
      {scssError && (
        <Text variant="caption" tone="negative">
          Line {scssError.line}: {scssError.message.split('\n')[0]} The preview keeps the
          last CSS that compiled.
        </Text>
      )}
      {rewritten.length > 0 && (
        <Text variant="caption" tone="muted">
          Rewritten for your project: {rewritten.join(', ')}.
        </Text>
      )}
    </Stack>
  )
}
