import { describe, expect, it } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  buildFromSpec,
  createAuthoringEnvironment,
  DropZone,
  PanelArea,
  PanelDock,
  panelsActions,
  RESERVED_STAGE_ID,
  uid,
  type LayoutSpec,
  type PanelRegistrant,
} from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

const panel = (id: string, title: string): PanelRegistrant => ({
  id,
  title,
  area: PanelArea.LEFT,
  component: () => <p>{title} body</p>,
})

const layers = panel('layers', 'Layers')
const library = panel('library', 'Library')
const properties = panel('properties', 'Properties')

const layout: LayoutSpec = {
  kind: 'row',
  children: [
    { size: 220, spec: { kind: 'tabs', ids: ['layers', 'library'] } },
    { spec: { kind: 'stage' } },
    { size: 240, spec: { kind: 'panel', id: 'properties' } },
  ],
}

const renderDock = () => {
  const env = createAuthoringEnvironment()
  const utils = render(
    <env.Provider>
      <PanelDock
        panels={[layers, library, properties]}
        initialWorkspace={buildFromSpec(layout)}
        renderReserved={(id) => (id === RESERVED_STAGE_ID ? <div>The stage</div> : null)}
      />
    </env.Provider>
  )
  return { env, ...utils }
}

describe('PanelDock', () => {
  it('renders the layout: tab groups, the stage, and the active panels', async () => {
    const { container, env } = renderDock()
    expect(screen.getByText('The stage')).toBeInTheDocument()
    expect(screen.getByText('Layers body')).toBeInTheDocument()
    expect(screen.queryByText('Library body')).not.toBeInTheDocument()
    expect(screen.getByText('Properties body')).toBeInTheDocument()
    // Seeded into the store on mount, so reducers have a tree to edit.
    expect(env.store.getState().panels.workspace.rootId).not.toBeNull()
    await expectNoAxeViolations(container)
  })

  it('names each group’s tabs and panel', () => {
    renderDock()
    const tab = screen.getByRole('tab', { name: 'Layers' })
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Layers' })).toHaveTextContent(
      'Layers body'
    )
  })

  it('switches tabs by click and by arrow keys, moving focus with the selection', async () => {
    const user = userEvent.setup()
    renderDock()
    await user.click(screen.getByRole('tab', { name: 'Library' }))
    expect(screen.getByText('Library body')).toBeInTheDocument()

    await user.keyboard('{ArrowRight}')
    const layersTab = screen.getByRole('tab', { name: 'Layers' })
    expect(layersTab).toHaveAttribute('aria-selected', 'true')
    expect(layersTab).toHaveFocus()

    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Library' })).toHaveFocus()
  })

  it('collapses a group to its tabs and expands it again', async () => {
    const user = userEvent.setup()
    renderDock()
    const collapse = screen.getByRole('button', { name: 'Collapse Properties' })
    expect(collapse).toHaveAttribute('aria-expanded', 'true')
    await user.click(collapse)

    const expand = screen.getByRole('button', { name: 'Expand Properties' })
    expect(expand).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.getByText('Properties body').closest('[role="tabpanel"]')
    ).not.toBeVisible()
    await user.click(expand)
    expect(screen.getByText('Properties body')).toBeVisible()
  })

  it('resizes a split from the keyboard and saves the size in the store', async () => {
    const user = userEvent.setup()
    const { env } = renderDock()
    const [first] = screen.getAllByRole('separator', { name: 'Resize panes' })
    expect(first).toHaveAttribute('aria-valuenow', '220')

    first!.focus()
    await user.keyboard('{ArrowRight}')
    expect(first).toHaveAttribute('aria-valuenow', '236')
    const sizes = Object.values(env.store.getState().panels.workspace.nodes)
      .filter((n) => n.kind === 'split')
      .map((n) => n.primarySize)
    expect(sizes).toContain(236)
  })

  it('keeps two editors’ layouts apart', async () => {
    const user = userEvent.setup()
    const a = renderDock()
    const b = renderDock()
    const [aLibrary] = within(a.container).getAllByRole('tab', { name: 'Library' })
    await user.click(aLibrary!)
    expect(within(a.container).getByText('Library body')).toBeInTheDocument()
    expect(within(b.container).queryByText('Library body')).not.toBeInTheDocument()
  })
})

describe('uid', () => {
  it('makes distinct ids of the asked length from letters and digits', () => {
    const ids = new Set(Array.from({ length: 500 }, () => uid()))
    expect(ids.size).toBe(500)
    for (const id of ids) expect(id).toMatch(/^[0-9A-Za-z]{16}$/)
    expect(uid(8)).toHaveLength(8)
  })
})

describe('PanelDock layoutKey', () => {
  const code = panel('code', 'Code')
  const codeLayout: LayoutSpec = {
    kind: 'row',
    children: [
      { spec: { kind: 'stage' } },
      { size: 300, spec: { kind: 'panel', id: 'code' } },
    ],
  }
  const stage = (id: string) => (id === RESERVED_STAGE_ID ? <div>The stage</div> : null)

  it('seeds its own layout when the store holds another workspace’s', () => {
    const env = createAuthoringEnvironment()
    const { rerender } = render(
      <env.Provider>
        <PanelDock
          layoutKey="design"
          panels={[layers, library, properties]}
          initialWorkspace={buildFromSpec(layout)}
          renderReserved={stage}
        />
      </env.Provider>
    )
    expect(env.store.getState().panels.layoutKey).toBe('design')

    rerender(
      <env.Provider>
        <PanelDock
          layoutKey="code"
          panels={[code]}
          initialWorkspace={buildFromSpec(codeLayout)}
          renderReserved={stage}
        />
      </env.Provider>
    )
    expect(screen.getByRole('tab', { name: 'Code' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Layers' })).not.toBeInTheDocument()
    const { panels } = env.store.getState()
    expect(panels.layoutKey).toBe('code')
    // The code layout's own tree: one split, the panel 300px at the end.
    const splits = Object.values(panels.workspace.nodes).filter((n) => n.kind === 'split')
    expect(splits.map((s) => s.primarySize)).toEqual([300])
  })

  it('keeps the stored layout without a key, as before', () => {
    const env = createAuthoringEnvironment()
    const props = { panels: [layers, library, properties], renderReserved: stage }
    const { rerender } = render(
      <env.Provider>
        <PanelDock {...props} initialWorkspace={buildFromSpec(layout)} />
      </env.Provider>
    )
    const before = env.store.getState().panels.workspace
    rerender(
      <env.Provider>
        <PanelDock {...props} initialWorkspace={buildFromSpec(codeLayout)} />
      </env.Provider>
    )
    expect(env.store.getState().panels.workspace).toBe(before)
  })
})

describe('PanelDock FREE panels', () => {
  const notes: PanelRegistrant = {
    ...panel('notes', 'Notes'),
    area: PanelArea.FREE,
    x: 40,
    y: 40,
  }

  it('shows a docked FREE panel once: docked, no longer floating', () => {
    const env = createAuthoringEnvironment()
    render(
      <env.Provider>
        <PanelDock
          panels={[layers, library, properties, notes]}
          initialWorkspace={buildFromSpec(layout)}
          renderReserved={(id) =>
            id === RESERVED_STAGE_ID ? <div>The stage</div> : null
          }
        />
      </env.Provider>
    )
    expect(screen.getAllByText('Notes body')).toHaveLength(1)
    const target = Object.values(env.store.getState().panels.workspace.nodes).find(
      (n) => n.kind === 'leaf' && n.tabs.includes('properties')
    )!
    act(() =>
      env.store.dispatch(
        panelsActions.movePanel({
          panelId: 'notes',
          targetLeafId: target.id,
          zone: DropZone.Bottom,
        })
      )
    )
    expect(screen.getAllByText('Notes body')).toHaveLength(1)
    expect(screen.getAllByRole('tab', { name: 'Notes' })).toHaveLength(1)
  })
})
