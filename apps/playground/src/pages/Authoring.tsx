import { useMemo, type JSX } from 'react'
import {
  buildFromSpec,
  createAuthoringEnvironment,
  PanelArea,
  PanelDock,
  RESERVED_STAGE_ID,
  type LayoutSpec,
  type PanelRegistrant,
} from '@greese/authoring'
import '@greese/react/base.css'
import '@greese/react/styles.css'
import '@greese/authoring/styles.css'

const panel = (id: string, title: string): PanelRegistrant => ({
  id,
  title,
  area: PanelArea.LEFT,
  component: () => <p style={{ margin: '0.5rem' }}>{title} body</p>,
})

const panels = [
  panel('layers', 'Layers'),
  panel('library', 'Library'),
  panel('properties', 'Properties'),
]

// Narrow enough for a phone: both side columns and the stage fit in 390px.
const layout: LayoutSpec = {
  kind: 'row',
  children: [
    { size: 120, spec: { kind: 'tabs', ids: ['layers', 'library'] } },
    { spec: { kind: 'stage' } },
    { size: 120, spec: { kind: 'panel', id: 'properties' } },
  ],
}

/** @greese/authoring fixtures for e2e/authoring.spec.ts. */
export const Authoring = (): JSX.Element => {
  const env = useMemo(() => createAuthoringEnvironment(), [])
  const workspace = useMemo(() => buildFromSpec(layout), [])
  return (
    <main style={{ blockSize: '100dvh', padding: '0.5rem', boxSizing: 'border-box' }}>
      <env.Provider>
        <PanelDock
          panels={panels}
          initialWorkspace={workspace}
          renderReserved={(id) =>
            id === RESERVED_STAGE_ID ? (
              <div data-testid="stage" style={{ flex: 1 }}>
                Stage
              </div>
            ) : null
          }
        />
      </env.Provider>
    </main>
  )
}
