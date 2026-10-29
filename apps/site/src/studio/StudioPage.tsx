import '../styles/library.ts'
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
} from 'react'
import {
  Alert,
  Button,
  Sidebar,
  SidebarLayout,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  useColorScheme,
} from '@greese/react'
import { icons } from '../icons.tsx'
import { Footer } from '../sections/LazyFooter.tsx'
import { useShell } from '../shell.ts'
import { hosted } from './api.ts'
import { PaletteOptions } from './fields.tsx'
import { StudioToolbar } from './StudioControls.tsx'
import { GreeseStage } from './GreeseStage.tsx'
import { useGreeseLab } from './greeseLab.ts'
import { CodePanel } from './panels/CodePanel.tsx'
import { ComponentsPanel } from './panels/ComponentsPanel.tsx'
import { MotionPanel } from './panels/MotionPanel.tsx'
import { ShapesPanel } from './panels/ShapesPanel.tsx'
import { TokensPanel } from './panels/TokensPanel.tsx'
import type { Picked } from './protocol.ts'
import { customBreakpoints } from './spec.ts'
import { useCompile } from './useCompile.ts'
import { usePreviewSync } from './usePreviewSync.ts'
import { useStudioTab, type StudioTab } from './useStudioTab.ts'
import { useThemeFile } from './useThemeFile.ts'
import './studio.scss'

/**
 * The studio page: the editor and the preview it themes. The theme itself
 * (the spec) lives in the shell, shared with the homepage's theme menu; what's
 * here is the studio's own state; Inspect, Import and Save head its editor.
 * The file, the compile, the preview and the tab are hooks of their own.
 */
export const StudioPage = (): JSX.Element => {
  const { spec, setSpec, rendered, setRendered, replay } = useShell()
  const { scheme } = useColorScheme()
  // Inspect: a click in the preview picks the component to edit.
  const [inspect, setInspect] = useState(false)
  const [tab, setTab] = useStudioTab()
  const [component, setComponent] = useState('Button')
  const [picked, setPicked] = useState<Picked>()
  const frame = useRef<HTMLIFrameElement>(null)
  // Wide, the frame is as tall as what it shows, and the page scrolls.
  const [previewHeight, setPreviewHeight] = useState<number>()
  const lab = useGreeseLab(spec, setSpec)
  const theme = useThemeFile(spec, setSpec)
  const { file, loadError, dirty, changedOnDisk, savedNote } = theme
  const { compiled, building, errors, errorAt, setErrors } = useCompile(spec, !!file)

  usePreviewSync({
    frame,
    spec,
    compiled,
    scheme,
    inspect,
    component,
    highlight: inspect && tab === 'components',
    replay,
    onReplay: lab.play,
    onColors: setRendered,
    onPick: (pick) => {
      setPicked(pick)
      setComponent(pick.block)
      setTab('components')
    },
    onSize: setPreviewHeight,
  })
  // The rendered colors belong to this page's preview.
  useEffect(() => () => setRendered(undefined), [setRendered])

  // The theme's own breakpoints: the Code panel's app setup needs them too.
  const custom = customBreakpoints(spec)

  // The editor's id, for the bar's trigger: SidebarLayout makes it, and the
  // library's SidebarTrigger can't show a word beside its icon (as the docs).
  const editor = useRef<HTMLElement>(null)
  const [editorId, setEditorId] = useState<string>()
  useLayoutEffect(() => setEditorId(editor.current?.id), [])

  const save = async () => {
    const refused = await theme.save()
    if (refused) setErrors(refused)
  }

  return (
    // Below md the editor is a sheet opened from the bar above the preview;
    // from md, a column that stays in view while the page scrolls.
    <SidebarLayout breakpoint="md" className="studio">
      <PaletteOptions />
      <Sidebar ref={editor} label="Theme editor" className="studio-editor">
        <StudioToolbar
          inspect={inspect}
          onInspect={setInspect}
          saving={theme.saving}
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
              <Button size="sm" onClick={() => void theme.load()}>
                Load it
              </Button>
              <Button size="sm" variant="ghost" onClick={theme.keepMine}>
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
      </Sidebar>
      <div className="studio-main">
        <div className="studio-drawer-bar">
          <Text variant="p3" tone="muted">
            Theme preview
          </Text>
          <Button
            size="sm"
            variant="soft"
            tone="neutral"
            endIcon={icons.sliders}
            popoverTarget={editorId}
            aria-label="Theme editor"
            className="studio-drawer-trigger"
          >
            Editor
          </Button>
        </div>
        {tab === 'motion' && <GreeseStage lab={lab} spec={spec} />}
        <iframe
          hidden={tab === 'motion'}
          ref={frame}
          src={`${import.meta.env.BASE_URL}preview.html`}
          title="Theme preview"
          className="studio-preview-frame"
          style={
            previewHeight
              ? ({ '--studio-preview-height': `${previewHeight}px` } as CSSProperties)
              : undefined
          }
        />
        <Suspense>
          <Footer />
        </Suspense>
      </div>
    </SidebarLayout>
  )
}
