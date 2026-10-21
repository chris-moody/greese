import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import {
  Alert,
  Button,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  useColorScheme,
} from '@greese/react'
import { useShell } from '../shell.ts'
import { api, hosted } from './api.ts'
import { PaletteOptions } from './fields.tsx'
import { GreeseStage } from './GreeseStage.tsx'
import { useGreeseLab } from './greeseLab.ts'
import { CodePanel } from './panels/CodePanel.tsx'
import { ComponentsPanel } from './panels/ComponentsPanel.tsx'
import { GreesePanel } from './panels/GreesePanel.tsx'
import { MotionPanel } from './panels/MotionPanel.tsx'
import { TokensPanel } from './panels/TokensPanel.tsx'
import type { FromPreview, Picked, ToPreview } from './protocol.ts'
import { customBreakpoints } from './spec.ts'
import './studio.css'

interface FileState {
  file: string
  outputs: string[]
  /** The spec as last read or saved: unsaved changes differ from it. */
  saved: string
}

/**
 * The studio page: the editor and the preview it themes. The theme itself
 * (the spec) lives in the shell, shared with the homepage's theme menu; what's
 * here is the studio's own state, and its Save and Import controls, which the
 * shared header shows.
 */
export const StudioPage = (): JSX.Element => {
  const { spec, setSpec, rendered, setRendered, replay, inspect, setStudio } = useShell()
  const { scheme } = useColorScheme()
  const [file, setFile] = useState<FileState>()
  const [loadError, setLoadError] = useState<string>()
  const [compiled, setCompiled] = useState({ scss: '', css: '', full: false })
  const [building, setBuilding] = useState(false)
  /** The latest compile, so a slow one (a whole stylesheet) never lands after a newer. */
  const latest = useRef(0)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  /** What the last save wrote; cleared by the next edit, since the button then says Save. */
  const [written, setWritten] = useState<string[]>()
  const [changedOnDisk, setChangedOnDisk] = useState(false)
  const [tab, setTab] = useState('tokens')
  const [component, setComponent] = useState('Button')
  const [picked, setPicked] = useState<Picked>()
  const frame = useRef<HTMLIFrameElement>(null)
  const lab = useGreeseLab()

  const dirty = !!file && JSON.stringify(spec) !== file.saved
  /** What the button says once the last save is all there is: the files it wrote. */
  const savedNote = !dirty && written ? `Saved ${written.join(', ')}` : undefined

  const post = useCallback((message: ToPreview) => {
    frame.current?.contentWindow?.postMessage(message, location.origin)
  }, [])

  /**
   * Reads the theme file. Arriving at the studio keeps the theme you're
   * wearing (it then shows as unsaved if it differs from the file); only an
   * explicit reload takes the file's.
   */
  const load = useCallback(async (adopt = true) => {
    try {
      const loaded = await api.load()
      if (adopt) setSpec(loaded.spec)
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

  // The dev server reads the theme file; the hosted studio works on the
  // theme the shell holds (what was chosen in the header, or last saved).
  useEffect(() => {
    if (hosted) {
      setFile({ file: 'Kept in this browser', outputs: [], saved: JSON.stringify(spec) })
      return
    }
    void load(false)
  }, [])

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
      const run = ++latest.current
      // Only a theme with its own breakpoints builds the whole stylesheet.
      setBuilding(!!customBreakpoints(spec))
      const result = await api.compile(spec)
      if (run !== latest.current) return
      setBuilding(false)
      setErrors(result.errors ?? [])
      if (result.css !== undefined)
        setCompiled({ scss: result.scss!, css: result.css, full: !!result.full })
    }, 150)
    return () => clearTimeout(timer)
  }, [spec, file])

  const custom = customBreakpoints(spec)
  const breakpointsKey = JSON.stringify(custom ?? null)
  const cssMessage = (): ToPreview => ({
    type: 'css',
    css: compiled.css,
    full: compiled.full,
    breakpoints: compiled.full && custom ? Object.fromEntries(custom) : undefined,
  })
  useEffect(() => post(cssMessage()), [compiled.css, compiled.full, breakpointsKey, post])
  useEffect(
    () => post({ type: 'scope', theme: spec.name || undefined, scheme }),
    [spec.name, scheme, post]
  )
  // "Replay motion" in the header remounts the preview's gallery.
  const replayed = useRef(replay)
  useEffect(() => {
    if (replay !== replayed.current) {
      post({ type: 'replay' })
      lab.play()
    }
    replayed.current = replay
  }, [replay, post, lab.play])
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
        post(cssMessage())
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

  // What the header shows for the studio: Save, and whether there's anything to save.
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    setStudio({
      dirty,
      saving,
      canSave: dirty && errors.length === 0,
      savedNote,
      save: () => void saveRef.current(),
    })
  }, [dirty, saving, errors.length, savedNote, setStudio])
  useEffect(() => () => setStudio(null), [setStudio])
  // Inspect and the rendered colors belong to this page's preview.
  useEffect(() => () => setRendered(undefined), [setRendered])

  const showComponent = (name: string) => {
    setComponent(name)
    setTab('components')
  }

  return (
    <div className="studio">
      <div className="studio-body">
        <PaletteOptions />
        <aside className="studio-editor">
          {file && (
            <Text variant="p3" tone="muted" className="studio-file">
              {file.file}
            </Text>
          )}
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
              <Tab value="greese">Greese</Tab>
              <Tab value="code">Code</Tab>
            </TabList>
            <TabPanel value="tokens">
              <TokensPanel
                spec={spec}
                onChange={setSpec}
                rendered={rendered}
                building={building}
              />
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
            <TabPanel value="greese">
              <GreesePanel lab={lab} />
            </TabPanel>
            <TabPanel value="code">
              <CodePanel
                scss={compiled.scss}
                css={compiled.css}
                outputs={file?.outputs ?? []}
                spec={hosted ? spec : undefined}
                breakpoints={custom}
              />
            </TabPanel>
          </Tabs>
        </aside>
        {tab === 'greese' && <GreeseStage lab={lab} />}
        <iframe
          hidden={tab === 'greese'}
          ref={frame}
          src={`${import.meta.env.BASE_URL}preview.html`}
          title="Theme preview"
          className="studio-preview-frame"
        />
      </div>
    </div>
  )
}
