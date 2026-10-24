import { useState, type JSX } from 'react'
import {
  Alert,
  Badge,
  Button,
  Code,
  Collapsible,
  Dialog,
  Field,
  FileInput,
  Icon,
  IconButton,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  Textarea,
  TextField,
} from '@greese/react'
import { icons } from '../icons.tsx'
import { api, hosted, type ImportSource } from './api.ts'
import { mergeSpecs, type ImportResult } from './importer.ts'
import type { ThemeSpec } from './spec.ts'

interface ImportDialogProps {
  spec: ThemeSpec
  onImport: (spec: ThemeSpec) => void
}

/**
 * Brings an existing theme into the editor: pasted or uploaded JSON, CSS or
 * SCSS, or a file in the project (including a module that exports
 * `createTheme()` results). Shows what came in and what didn't before
 * changing anything.
 */
export const ImportDialog = ({ spec, onImport }: ImportDialogProps): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('paste')
  const [text, setText] = useState('')
  const [format, setFormat] = useState<'' | 'json' | 'css' | 'scss'>('')
  const [file, setFile] = useState<{ name: string; text: string }>()
  const [path, setPath] = useState('')
  const [source, setSource] = useState<ImportSource>()
  const [result, setResult] = useState<ImportResult>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const run = async (next: ImportSource) => {
    setBusy(true)
    setError(undefined)
    const response = await api.import(next)
    setBusy(false)
    if ('errors' in response) {
      setResult(undefined)
      setError(response.errors.join('\n'))
      return
    }
    setSource(next)
    setResult(response)
  }

  const current = (): ImportSource | undefined => {
    if (tab === 'paste' && text.trim()) return { text, ...(format && { format }) }
    if (tab === 'file' && file) return { text: file.text, filename: file.name }
    if (tab === 'project' && path.trim()) return { path: path.trim() }
    return undefined
  }

  const apply = (merge: boolean) => {
    if (!result) return
    onImport(merge ? mergeSpecs(spec, result.spec) : result.spec)
    setOpen(false)
    setResult(undefined)
  }

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

  const skippedCss = result?.skipped
    .map((s) => `/* ${s.reason} */\n${s.css}`)
    .join('\n\n')

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      size="lg"
      trigger={
        <IconButton size="sm" variant="soft" label="Import a theme">
          <Icon>{icons.import}</Icon>
        </IconButton>
      }
      title="Import a theme"
      description="From a studio JSON file, createTheme() options or output, the SCSS kit, or hand-written CSS overrides."
      footer={
        result && (
          <Stack direction="row" gap={2} justify="end" wrap="wrap">
            <Button variant="soft" tone="neutral" onClick={() => apply(true)}>
              Merge into current theme
            </Button>
            <Button onClick={() => apply(false)}>Replace current theme</Button>
          </Stack>
        )
      }
    >
      <Stack gap={4}>
        <Tabs value={tab} onValueChange={setTab}>
          <TabList aria-label="Import from">
            <Tab value="paste">Paste</Tab>
            <Tab value="file">Upload</Tab>
            {!hosted && <Tab value="project">From project</Tab>}
          </TabList>
          <TabPanel value="paste">
            <Stack gap={3}>
              <Field label="Theme">
                <Textarea
                  rows={8}
                  value={text}
                  spellCheck={false}
                  placeholder={
                    ':root { --greese-color-accent: #7c3aed; }\n.greese-Card { box-shadow: var(--greese-shadow-lg); }'
                  }
                  className="studio-mono"
                  onChange={(e) => setText(e.currentTarget.value)}
                />
              </Field>
              <Field label="Format">
                <Select
                  size="sm"
                  value={format}
                  onChange={(e) => setFormat(e.currentTarget.value as typeof format)}
                >
                  <option value="">Detect</option>
                  <option value="json">JSON (studio theme or createTheme options)</option>
                  <option value="css">CSS</option>
                  <option value="scss">SCSS (compiled with the kit)</option>
                </Select>
              </Field>
            </Stack>
          </TabPanel>
          <TabPanel value="file">
            <Field label="File" description=".json, .css or .scss">
              <FileInput
                accept=".json,.css,.scss"
                onChange={async (e) => {
                  const picked = e.currentTarget.files?.[0]
                  setFile(picked && { name: picked.name, text: await picked.text() })
                }}
              />
            </Field>
          </TabPanel>
          {!hosted && (
            <TabPanel value="project">
              <TextField
                label="Path"
                description="Relative to where you ran npm. .json, .css or .scss, or a .ts/.js module that exports createTheme() results (it runs in the studio's server). SCSS files can use their own imports."
                placeholder="src/theme.ts"
                value={path}
                spellCheck={false}
                onChange={(e) => setPath(e.currentTarget.value)}
              />
            </TabPanel>
          )}
        </Tabs>

        <div>
          <Button
            variant="outline"
            loading={busy}
            disabled={!current()}
            onClick={() => {
              const next = current()
              if (next) void run(next)
            }}
          >
            Read theme
          </Button>
        </div>

        {error && (
          <Alert tone="negative" title="Couldn’t import that">
            <pre className="studio-errors">{error}</pre>
          </Alert>
        )}

        {result && (
          <Stack gap={3} role="status">
            <Stack direction="row" gap={2} wrap="wrap" align="center">
              {/* Each layer of a theme in its own brand color, as on the homepage (tones.ts). */}
              <Badge tone="secondary">{plural(result.counts.tokens, 'token')}</Badge>
              <Badge tone="tertiary">{plural(result.counts.components, 'component')}</Badge>
              <Badge tone="accent">
                {plural(result.counts.motion, 'motion setting')}
              </Badge>
              {result.skipped.length > 0 && (
                <Badge tone="warning">{result.skipped.length} not imported</Badge>
              )}
            </Stack>
            {result.themes.length > 1 && source && (
              <Field
                label="Theme"
                description="The CSS holds several themes. The studio edits one at a time."
              >
                <Select
                  size="sm"
                  value={result.spec.name}
                  onChange={(e) => void run({ ...source, theme: e.currentTarget.value })}
                >
                  {result.themes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
            )}
            {result.themes.length === 1 && (
              <Text variant="p3" tone="muted">
                A named theme: <Code>{result.themes[0]}</Code>.
              </Text>
            )}
            {result.skipped.length > 0 && (
              <Collapsible
                title={`Not imported (${result.skipped.length}): keep it in a stylesheet of your own`}
              >
                <Stack gap={3}>
                  <div>
                    <Button
                      size="sm"
                      variant="soft"
                      tone="neutral"
                      onClick={() => void navigator.clipboard.writeText(skippedCss ?? '')}
                    >
                      Copy all of it
                    </Button>
                  </div>
                  {result.skipped.map((s, i) => (
                    <Stack key={i} gap={1}>
                      <Text variant="p3">{s.reason}</Text>
                      <Code block className="studio-code">
                        {s.css}
                      </Code>
                    </Stack>
                  ))}
                </Stack>
              </Collapsible>
            )}
            <Text variant="p3" tone="muted">
              Nothing changes until you replace or merge, and nothing is written until you
              save.
            </Text>
          </Stack>
        )}
      </Stack>
    </Dialog>
  )
}
