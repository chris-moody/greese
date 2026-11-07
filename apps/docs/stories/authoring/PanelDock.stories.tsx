import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  buildFromSpec,
  createAuthoringEnvironment,
  PanelArea,
  PanelDock,
  RESERVED_STAGE_ID,
  RESERVED_TIMELINE_ID,
  type LayoutSpec,
  type PanelRegistrant,
} from '@greese/authoring'
import '@greese/authoring/styles.css'
import { Center, Stack, Text } from '@greese/react'

const Note = ({ children }: { children: string }) => (
  <Text variant="caption" tone="muted" style={{ margin: 'var(--greese-space-2)' }}>
    {children}
  </Text>
)

const LayersPanel = () => <Note>Layers: the document’s tree.</Note>
const LibraryPanel = () => <Note>Library: reusable symbols.</Note>
const PropertiesPanel = () => <Note>Properties of the selection.</Note>
const ToolsPanel = () => (
  <Stack gap={1} style={{ padding: 'var(--greese-space-1)' }}>
    <Text variant="caption">V</Text>
    <Text variant="caption">P</Text>
    <Text variant="caption">T</Text>
  </Stack>
)
const NotesPanel = () => <Note>A floating panel: drag its tab back into the dock.</Note>

const panel = (
  id: string,
  title: string,
  component: PanelRegistrant['component'],
  extra: Partial<PanelRegistrant> = {}
): PanelRegistrant => ({ id, title, area: PanelArea.LEFT, component, ...extra })

const layers = panel('layers', 'Layers', LayersPanel)
const library = panel('library', 'Library', LibraryPanel)
const properties = panel('properties', 'Properties', PropertiesPanel)
const tools = panel('tools', 'Tools', ToolsPanel, { headless: true, collapsible: false })
const notes = panel('notes', 'Notes', NotesPanel, { area: PanelArea.FREE, x: 260, y: 64 })

/** Layers and Library share a group on the left; Properties sits on the right. */
const designLayout: LayoutSpec = {
  kind: 'row',
  children: [
    { size: 180, spec: { kind: 'tabs', ids: ['layers', 'library'] } },
    { spec: { kind: 'stage' } },
    { size: 200, spec: { kind: 'panel', id: 'properties' } },
  ],
}

const Stage = () => (
  <Center
    style={{
      flex: 1,
      backgroundImage: 'radial-gradient(var(--greese-color-border) 1px, transparent 1px)',
      backgroundSize: '16px 16px',
    }}
  >
    <Text tone="muted">Stage</Text>
  </Center>
)

const Timeline = () => (
  <Center style={{ flex: 1, borderBlockStart: '1px solid var(--greese-color-border)' }}>
    <Text tone="muted">Timeline</Text>
  </Center>
)

const renderReserved = (id: string) =>
  id === RESERVED_STAGE_ID ? <Stage /> : id === RESERVED_TIMELINE_ID ? <Timeline /> : null

const meta = {
  title: 'Authoring/PanelDock',
  component: PanelDock,
  args: {
    panels: [layers, library, properties],
    hasTimeline: false,
  },
  argTypes: {
    panels: { control: false },
    initialWorkspace: { control: false },
    renderReserved: { control: false },
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PanelDock>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A workspace from a `LayoutSpec`: drag a tab to any edge of any group, onto
 * a group to join it, along the workspace's edge, or onto empty space to
 * float it. The dividers resize by dragging, or by the arrow keys once
 * focused. Each editor has its own store, from `createAuthoringEnvironment`.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [env] = useState(() => createAuthoringEnvironment())
    const [workspace] = useState(() => buildFromSpec(designLayout))
    return (
      <div style={{ blockSize: '28rem', padding: 'var(--greese-space-2)' }}>
        <env.Provider>
          <PanelDock
            {...args}
            initialWorkspace={workspace}
            renderReserved={renderReserved}
          />
        </env.Provider>
      </div>
    )
  },
}

/** With `hasTimeline`, a `timeline` leaf in the spec renders through `renderReserved` too. */
export const WithTimeline: Story = {
  args: { hasTimeline: true },
  render: function WithTimeline(args) {
    const [env] = useState(() => createAuthoringEnvironment())
    const [workspace] = useState(() =>
      buildFromSpec({
        kind: 'col',
        children: [{ spec: designLayout }, { size: 120, spec: { kind: 'timeline' } }],
      })
    )
    return (
      <div style={{ blockSize: '30rem', padding: 'var(--greese-space-2)' }}>
        <env.Provider>
          <PanelDock
            {...args}
            initialWorkspace={workspace}
            renderReserved={renderReserved}
          />
        </env.Provider>
      </div>
    )
  },
}

/**
 * A `headless` panel is toolbar-style: a slim drag bar instead of tabs, and
 * it never joins a tab group.
 */
export const Toolbar: Story = {
  args: { panels: [tools, layers, library, properties] },
  render: function Toolbar(args) {
    const [env] = useState(() => createAuthoringEnvironment())
    const [workspace] = useState(() =>
      buildFromSpec({
        kind: 'row',
        children: [
          { size: 44, spec: { kind: 'panel', id: 'tools', headless: true } },
          { spec: designLayout },
        ],
      })
    )
    return (
      <div style={{ blockSize: '28rem', padding: 'var(--greese-space-2)' }}>
        <env.Provider>
          <PanelDock
            {...args}
            initialWorkspace={workspace}
            renderReserved={renderReserved}
          />
        </env.Provider>
      </div>
    )
  },
}

/** A `FREE` panel floats over the workspace from its `x` and `y`, and resizes from its corner. */
export const Floating: Story = {
  args: { panels: [layers, library, properties, notes] },
  render: function Floating(args) {
    const [env] = useState(() => createAuthoringEnvironment())
    const [workspace] = useState(() => buildFromSpec(designLayout))
    return (
      <div style={{ blockSize: '28rem', padding: 'var(--greese-space-2)' }}>
        <env.Provider>
          <PanelDock
            {...args}
            initialWorkspace={workspace}
            renderReserved={renderReserved}
          />
        </env.Provider>
      </div>
    )
  },
}
