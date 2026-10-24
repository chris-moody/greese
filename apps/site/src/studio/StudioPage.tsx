import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react'
import {
  Alert,
  Button,
  Icon,
  IconButton,
  Show,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  useColorScheme,
} from '@greese/react'
import { icons } from '../icons.tsx'
import { useShell } from '../shell.ts'
import { useStable } from '../useStable.ts'
import { api, hosted } from './api.ts'
import { PaletteOptions } from './fields.tsx'
import { StudioToolbar } from './StudioControls.tsx'
import { GreeseStage } from './GreeseStage.tsx'
import { useGreeseLab } from './greeseLab.ts'
import { CodePanel } from './panels/CodePanel.tsx'
import { ComponentsPanel } from './panels/ComponentsPanel.tsx'
import { MotionPanel } from './panels/MotionPanel.tsx'
import { ShapesPanel } from './panels/ShapesPanel.tsx'
import { TokensPanel } from './panels/TokensPanel.tsx'
import type { FromPreview, Picked, ToPreview } from './protocol.ts'
import type { ErrorAt } from './scssModule.ts'
import { customBreakpoints } from './spec.ts'
import './studio.scss'

const TABS = ['tokens', 'components', 'shapes', 'motion', 'code'] as const
type StudioTab = (typeof TABS)[number]

/** The tab a link opens: `/studio?tab=motion`. Tokens when there's none, or it's unknown. */
const tabFromUrl = (): StudioTab => {
  const tab = new URLSearchParams(location.search).get('tab')
  return TABS.find((t) => t === tab) ?? 'tokens'
}

interface FileState {
  file: string
  outputs: string[]
  /** The spec as last read or saved: unsaved changes differ from it. */
  saved: string
}

/**
 * The studio page: the editor and the preview it themes. The theme itself
 * (the spec) lives in the shell, shared with the homepage's theme menu; what's
 * here is the studio's own state; Inspect, Import and Save head its editor.
 */
export const StudioPage = (): JSX.Element => {
  const { spec, setSpec, rendered, setRendered, replay } = useShell()
  const { scheme } = useColorScheme()
  // Below md the editor is a drawer over the preview; from md it's a column.
  const [drawer, setDrawer] = useState(false)
  // Inspect: a click in the preview picks the component to edit.
  const [inspect, setInspect] = useState(false)
  // The dev server reads the theme file; the hosted studio works on the
  // theme the shell holds (what was chosen in the header, or last saved).
  const [file, setFile] = useState<FileState | undefined>(() =>
    hosted
      ? { file: 'Kept in this browser', outputs: [], saved: JSON.stringify(spec) }
      : undefined
  )
  const [loadError, setLoadError] = useState<string>()
  const [compiled, setCompiled] = useState({
    scss: '',
    css: '',
    effects: undefined as string | undefined,
    full: false,
  })
  const [building, setBuilding] = useState(false)
  /** The latest compile, so a slow one (a whole stylesheet) never lands after a newer. */
  const latest = useRef(0)
  const [errors, setErrors] = useState<string[]>([])
  /** Where the last compile error is, when it's in a component's SCSS. */
  const [errorAt, setErrorAt] = useState<ErrorAt>()
  const [saving, setSaving] = useState(false)
  /** What the last save wrote; cleared by the next edit, since the button then says Save. */
  const [written, setWritten] = useState<string[]>()
  const [changedOnDisk, setChangedOnDisk] = useState(false)
  const [tab, setTab] = useState<StudioTab>(tabFromUrl)
  const [component, setComponent] = useState('Button')
  const [picked, setPicked] = useState<Picked>()
  const frame = useRef<HTMLIFrameElement>(null)
  const lab = useGreeseLab(spec, setSpec)

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
  const load = useCallback(
    async (adopt = true) => {
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
    },
    [setSpec]
  )

  useEffect(() => {
    if (!hosted) void load(false)
  }, [load])

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
      setErrorAt(result.at)
      if (result.css !== undefined)
        setCompiled({
          scss: result.scss!,
          css: result.css,
          effects: result.effects,
          full: !!result.full,
        })
    }, 150)
    return () => clearTimeout(timer)
  }, [spec, file])

  const effects = useStable(spec.effects)
  const custom = useStable(customBreakpoints(spec))
  const cssMessage = useMemo<ToPreview>(
    () => ({
      type: 'css',
      css: compiled.css,
      full: compiled.full,
      breakpoints: compiled.full && custom ? Object.fromEntries(custom) : undefined,
    }),
    [compiled.css, compiled.full, custom]
  )
  useEffect(() => post(cssMessage), [cssMessage, post])
  useEffect(
    () => post({ type: 'scope', theme: spec.name || undefined, scheme }),
    [spec.name, scheme, post]
  )
  // "Replay motion" in the header remounts the preview's gallery.
  const replayed = useRef(replay)
  const { play: playLab } = lab
  useEffect(() => {
    if (replay !== replayed.current) {
      post({ type: 'replay' })
      playLab()
    }
    replayed.current = replay
  }, [replay, post, playLab])
  useEffect(() => post({ type: 'inspect', on: inspect }), [inspect, post])
  useEffect(() => post({ type: 'effects', effects }), [effects, post])
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
        post(cssMessage)
        post({ type: 'scope', theme: spec.name || undefined, scheme })
        post({ type: 'effects', effects })
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
  }, [cssMessage, spec.name, scheme, effects, inspect, component, post, setRendered])

  // The open tab is in the URL, so a link can open it. Replaced, not pushed:
  // switching tabs shouldn't fill the back button's history.
  useEffect(() => {
    const url = new URL(location.href)
    if (tab === 'tokens') url.searchParams.delete('tab')
    else url.searchParams.set('tab', tab)
    if (url.href !== location.href) history.replaceState(history.state, '', url)
  }, [tab])
  useEffect(() => {
    const onPop = () => setTab(tabFromUrl())
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])

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

  // The rendered colors belong to this page's preview.
  useEffect(() => () => setRendered(undefined), [setRendered])

  return (
    <div className="studio">
      <div className="studio-body">
        <PaletteOptions />
        <aside
          id="studio-editor"
          className="studio-editor"
          aria-label="Theme editor"
          data-open={drawer || undefined}
          onKeyDown={(e) => e.key === 'Escape' && setDrawer(false)}
        >
          <StudioToolbar
            inspect={inspect}
            onInspect={setInspect}
            saving={saving}
            canSave={dirty && errors.length === 0}
            savedNote={savedNote}
            onSave={() => void save()}
          />
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
          <Tabs value={tab} onValueChange={(v) => setTab(v as StudioTab)}>
            <TabList aria-label="Editor">
              <Tab value="tokens">Tokens</Tab>
              <Tab value="components">Components</Tab>
              <Tab value="shapes">Shapes</Tab>
              <Tab value="motion">Motion</Tab>
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
                errorAt={errorAt}
              />
            </TabPanel>
            <TabPanel value="shapes">
              <ShapesPanel spec={spec} onChange={setSpec} />
            </TabPanel>
            <TabPanel value="motion">
              <MotionPanel spec={spec} onChange={setSpec} lab={lab} />
            </TabPanel>
            <TabPanel value="code">
              {/* Only while open: it colours the whole compiled CSS. */}
              {tab === 'code' && (
                <CodePanel
                  scss={compiled.scss}
                  css={compiled.css}
                  effects={compiled.effects}
                  outputs={file?.outputs ?? []}
                  spec={hosted ? spec : undefined}
                  breakpoints={custom}
                />
              )}
            </TabPanel>
          </Tabs>
        </aside>
        <Show below="md">
          <div
            className="studio-scrim"
            data-open={drawer || undefined}
            onClick={() => setDrawer(false)}
            aria-hidden="true"
          />
          <IconButton
            className="studio-drawer-toggle"
            label={drawer ? 'Close the editor' : 'Open the editor'}
            aria-controls="studio-editor"
            aria-expanded={drawer}
            onClick={() => setDrawer((open) => !open)}
            variant="solid"
            tone="primary"
          >
            <Icon>{drawer ? icons.close : icons.sliders}</Icon>
          </IconButton>
        </Show>
        {tab === 'motion' && <GreeseStage lab={lab} />}
        <iframe
          hidden={tab === 'motion'}
          ref={frame}
          src={`${import.meta.env.BASE_URL}preview.html`}
          title="Theme preview"
          className="studio-preview-frame"
        />
      </div>
    </div>
  )
}
