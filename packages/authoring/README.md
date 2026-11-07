# `@greese/authoring`

Editor UI for greese: the furniture graphics, animation and sound authoring
tools share. It is built on `@greese/react` and styled like the rest of greese
ui, and it is React-only (ADR 0035).

It has:

- **`PanelDock`:** a workspace of tab groups around a stage and a timeline.
  Drag a tab to any edge of any group, onto a group to join it, along the
  workspace's edges, or onto empty space to float it. Splits resize by
  pointer or keyboard.
- **Layouts as data:** a `LayoutSpec` describes a workspace's default shape,
  `buildFromSpec` turns it into the layout tree, and `useLayoutCache`
  remembers how the user arranged each workspace.
- **A store per editor:** `createAuthoringEnvironment` gives each editor its
  own Redux store and provider, so editors can share a page or nest.
- **Layers and the library:** `HierarchicalList`, a keyboard tree to select,
  rename, reorder and nest; `LayerTree` binds it to the editor's layers, and
  `LibraryPanel` keeps its reusable symbols.
- **The stage:** `StageHost` mounts a media's renderer; `StageContext`,
  `StageBar`, `StageRulers` and `GuidesOverlay` go around it.
- **Tools:** one list (`ToolDefinition`) draws the `Toolbar`, picks tools by
  hotkey (`useToolHotkeys`) and builds their stage cursors
  (`createToolCursors`); `ToolOptionsPanel` holds the active tool's settings.
- **Navigation:** `NavBar` arranges `NavHistory`, `AuthoringBreadcrumbs` and
  `EnvironmentSelect`.

- **Property fields:** `PropertyGrid` lines up greese's `EditableField`
  rows; `ComplexColorField`, `GradientEditor` and `ToggleSelect` cover what
  `EditableField` doesn't.

The timeline and a code editor follow, moved from Glop's authoring framework
(see the ADRs).

## Install

```sh
npm install @greese/authoring @greese/react @reduxjs/toolkit react-redux immer
```

`@reduxjs/toolkit`, `react-redux` and `immer` are peer dependencies, so an app that
hosts several editors has one copy of each.

## Use

```tsx
import '@greese/react/styles.css'
import '@greese/authoring/styles.css' // after greese ui's
import {
  createAuthoringEnvironment,
  PanelArea,
  PanelDock,
  RESERVED_STAGE_ID,
  useInitialWorkspace,
  type LayoutSpec,
} from '@greese/authoring'

const env = createAuthoringEnvironment()

const panels = [
  { id: 'layers', title: 'Layers', area: PanelArea.LEFT, component: LayersPanel },
  {
    id: 'properties',
    title: 'Properties',
    area: PanelArea.RIGHT,
    component: PropertiesPanel,
  },
]

const layout: LayoutSpec = {
  kind: 'row',
  children: [
    { size: 220, spec: { kind: 'panel', id: 'layers' } },
    { spec: { kind: 'stage' } },
    { size: 260, spec: { kind: 'panel', id: 'properties' } },
  ],
}

export function Editor() {
  return (
    <env.Provider>
      <PanelDock
        panels={panels}
        initialWorkspace={useInitialWorkspace(layout)}
        renderReserved={(id) => (id === RESERVED_STAGE_ID ? <Stage /> : null)}
      />
    </env.Provider>
  )
}
```

Panels read and change the editor's store with `useAuthoringSelector` and
`useAuthoringDispatch`. An editor adds its own slices with
`createAuthoringEnvironment({ reducers })`.

## Entry points

| Entry                          | What                                                     | Needs        |
| ------------------------------ | -------------------------------------------------------- | ------------ |
| `@greese/authoring`            | Components, hooks, the environment; and everything below | React, Redux |
| `@greese/authoring/core`       | The layout tree, `LayoutSpec`, drag geometry, ids        | nothing      |
| `@greese/authoring/state`      | The store factory, slices and selectors                  | Redux        |
| `@greese/authoring/styles.css` | The styles, in `@layer greese.components`                | –            |

## Licence

MIT
