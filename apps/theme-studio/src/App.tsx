import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import {
  Alert,
  Badge,
  Button,
  Heading,
  Segment,
  SegmentedControl,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  VisuallyHidden,
  type ColorScheme,
} from '@greese/react'
import { api, hosted } from './api.ts'
import { PaletteOptions } from './fields.tsx'
import { ImportDialog } from './ImportDialog.tsx'
import { ThemeMenu } from './ThemeMenu.tsx'
import { CodePanel } from './panels/CodePanel.tsx'
import { ComponentsPanel } from './panels/ComponentsPanel.tsx'
import { MotionPanel } from './panels/MotionPanel.tsx'
import { TokensPanel } from './panels/TokensPanel.tsx'
import type { FromPreview, Picked, RenderedColors, ToPreview } from './protocol.ts'
import { emptySpec, type ThemeSpec } from './spec.ts'

interface FileState {
  file: string
  outputs: string[]
  /** The spec as last read or saved: unsaved changes differ from it. */
  saved: string
}

export const App = (): JSX.Element => {
  const [spec, setSpec] = useState<ThemeSpec>(emptySpec)
  const [file, setFile] = useState<FileState>()
  const [loadError, setLoadError] = useState<string>()
  const [compiled, setCompiled] = useState({ scss: '', css: '' })
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  /** What the last save wrote; cleared by the next edit, since the button then says Save. */
  const [written, setWritten] = useState<string[]>()
  const [changedOnDisk, setChangedOnDisk] = useState(false)
  const [tab, setTab] = useState('tokens')
  const [component, setComponent] = useState('Button')
  const [scheme, setScheme] = useState<ColorScheme>('system')
  const [inspect, setInspect] = useState(false)
  const [picked, setPicked] = useState<Picked>()
  const [rendered, setRendered] = useState<RenderedColors>()
  const frame = useRef<HTMLIFrameElement>(null)

  const dirty = !!file && JSON.stringify(spec) !== file.saved
  /** What the button says once the last save is all there is: the files it wrote. */
  const savedNote = !dirty && written ? `Saved ${written.join(', ')}` : undefined

  const post = useCallback((message: ToPreview) => {
    frame.current?.contentWindow?.postMessage(message, location.origin)
  }, [])

  const load = useCallback(async () => {
    try {
      const loaded = await api.load()
      setSpec(loaded.spec)
      setFile({
        file: loaded.file,
        outputs: loaded.outputs,
        saved: JSON.stringify(loaded.spec),
      })
      setChangedOnDisk(false)
      setWritten(undefined)
      setLoadError(undefined)
    } catch (error) {
      setLoadError((error as Error).message)
    }
  }, [])

  useEffect(() => void load(), [load])

  // Someone edited the theme file outside the studio.
  useEffect(() => {
    if (!import.meta.hot) return
    const onChange = () => setChangedOnDisk(true)
    import.meta.hot.on('studio:theme-changed', onChange)
    return () => import.meta.hot?.off('studio:theme-changed', onChange)
  }, [])
  useEffect(() => {
    if (changedOnDisk && !dirty) void load()
  }, [changedOnDisk, dirty, load])

  // Compile through the real kit as you type; the preview keeps the last
  // good CSS while there are errors.
  useEffect(() => {
    if (!file) return
    const timer = setTimeout(async () => {
      const result = await api.compile(spec)
      setErrors(result.errors ?? [])
      if (result.css !== undefined) setCompiled({ scss: result.scss!, css: result.css })
    }, 150)
    return () => clearTimeout(timer)
  }, [spec, file])

  useEffect(() => post({ type: 'css', css: compiled.css }), [compiled.css, post])
  useEffect(
    () => post({ type: 'scope', theme: spec.name || undefined, scheme }),
    [spec.name, scheme, post]
  )
  useEffect(() => post({ type: 'inspect', on: inspect }), [inspect, post])
  useEffect(() => post({ type: 'feature', block: component }), [component, post])
  useEffect(
    () =>
      post({
        type: 'highlight',
        block: inspect && tab === 'components' ? component : undefined,
      }),
    [inspect, tab, component, post]
  )

  useEffect(() => {
    const onMessage = (event: MessageEvent<FromPreview>) => {
      if (event.origin !== location.origin) return
      if (event.data.type === 'ready') {
        post({ type: 'css', css: compiled.css })
        post({ type: 'scope', theme: spec.name || undefined, scheme })
        post({ type: 'inspect', on: inspect })
        post({ type: 'feature', block: component })
      }
      if (event.data.type === 'colors') {
        const { type: _type, ...colors } = event.data
        setRendered(colors)
      }
      if (event.data.type === 'pick') {
        const { type: _type, ...pick } = event.data
        setPicked(pick)
        setComponent(pick.block)
        setTab('components')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [compiled.css, spec.name, scheme, inspect, component, post])

  const save = async () => {
    setSaving(true)
    const result = await api.save(spec)
    setSaving(false)
    if (result.errors?.length) {
      setErrors(result.errors)
      return
    }
    setFile((f) => f && { ...f, saved: JSON.stringify(spec) })
    setChangedOnDisk(false)
    setWritten(result.written)
  }

  const showComponent = (name: string) => {
    setComponent(name)
    setTab('components')
  }

  return (
    <div className="studio">
      <header className="studio-bar">
        <Stack direction="row" gap={3} align="center" wrap="wrap">
          <Heading level={1} size="lg">
            Theme Studio
          </Heading>
          {file && (
            <Text size="sm" tone="muted" className="studio-file">
              {file.file}
            </Text>
          )}
          {savedNote && (
            <Badge tone="positive" variant="solid" title={savedNote}>
              Saved
            </Badge>
          )}
        </Stack>
        <Stack direction="row" gap={3} align="center" wrap="wrap">
          <SegmentedControl
            label="Preview scheme"
            size="sm"
            value={scheme}
            onValueChange={(v) => setScheme(v as ColorScheme)}
          >
            <Segment value="system">System</Segment>
            <Segment value="light">Light</Segment>
            <Segment value="dark">Dark</Segment>
          </SegmentedControl>
          {file && <ThemeMenu spec={spec} onChange={setSpec} rendered={rendered} />}
          <Switch label="Inspect" checked={inspect} onCheckedChange={setInspect} />
          {file && <ImportDialog spec={spec} onImport={setSpec} />}
          <Button
            size="sm"
            variant="soft"
            tone="neutral"
            onClick={() => post({ type: 'replay' })}
          >
            Replay motion
          </Button>
          <Button
            size="sm"
            onClick={() => void save()}
            loading={saving}
            disabled={!dirty || errors.length > 0}
          >
            Save
          </Button>
          <VisuallyHidden role="status">{savedNote ?? ''}</VisuallyHidden>
        </Stack>
      </header>

      <div className="studio-body">
        <PaletteOptions />
        <aside className="studio-editor">
          {loadError && (
            <Alert tone="negative" title="Read-only">
              {loadError}
            </Alert>
          )}
          {changedOnDisk && dirty && (
            <Alert tone="warning" title="The theme file changed on disk">
              <Stack direction="row" gap={2}>
                <Button size="sm" onClick={() => void load()}>
                  Load it
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setChangedOnDisk(false)}>
                  Keep mine
                </Button>
              </Stack>
            </Alert>
          )}
          {errors.length > 0 && (
            <Alert tone="negative" title="The theme doesn’t compile">
              <pre className="studio-errors">{errors.join('\n')}</pre>
            </Alert>
          )}
          <Tabs value={tab} onValueChange={setTab}>
            <TabList aria-label="Editor">
              <Tab value="tokens">Tokens</Tab>
              <Tab value="components">Components</Tab>
              <Tab value="motion">Motion</Tab>
              <Tab value="code">Code</Tab>
            </TabList>
            <TabPanel value="tokens">
              <TokensPanel spec={spec} onChange={setSpec} rendered={rendered} />
            </TabPanel>
            <TabPanel value="components">
              <ComponentsPanel
                spec={spec}
                onChange={setSpec}
                component={component}
                onComponent={setComponent}
                picked={picked}
              />
            </TabPanel>
            <TabPanel value="motion">
              <MotionPanel spec={spec} onChange={setSpec} onComponent={showComponent} />
            </TabPanel>
            <TabPanel value="code">
              <CodePanel
                scss={compiled.scss}
                css={compiled.css}
                outputs={file?.outputs ?? []}
                spec={hosted ? spec : undefined}
              />
            </TabPanel>
          </Tabs>
        </aside>
        <iframe
          ref={frame}
          src={`${import.meta.env.BASE_URL}preview.html`}
          title="Theme preview"
          className="studio-preview-frame"
        />
      </div>
    </div>
  )
}
