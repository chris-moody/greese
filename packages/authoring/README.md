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
  `StageBar`, `StageRulers` and `GuidesOverlay` go around it. The context
  bar's `RulerToggle` and `GuidesToggle` show and hide them, and the rulers'
  `ticks="auto"` suits a drawing measured in a few units. `GridOverlay`
  draws a reference grid, set with `GridControl`. The wheel zooms at the
  pointer and a sideways swipe or Shift pans, as in Pixels: `StageHost` does
  it by default (`wheelZoom`), and `useWheelZoom` gives any stage the same.
- **Marking side by side:** `distinguishingColor(index)` gives thirty colours
  told apart at a glance, for a path's nodes or segments.
- **Tools:** one list (`ToolDefinition`) draws the `Toolbar`, picks tools by
  hotkey (`useToolHotkeys`) and builds their stage cursors
  (`createToolCursors`); `ToolOptionsPanel` holds the active tool's settings,
  and `ColorTool` the fill and stroke new shapes get.
- **Navigation:** `NavBar` arranges `NavHistory`, `AuthoringBreadcrumbs` and
  `EnvironmentSelect`.

- **Property fields:** `PropertyGrid` lines up greese's `EditableField`
  rows; `ComplexColorField`, `GradientEditor` and `ToggleSelect` cover what
  `EditableField` doesn't.

- **Code:** `CodeEditor` colours CSS, SCSS, JavaScript, TypeScript and XML
  with no dependency, lights the caret's line and a span, can number its
  lines and say where the caret is, and keeps its selection in step with a
  canvas. Its palette is `pkg:@greese/authoring/scss/code`.

- **Text boxes:** `TextBoxEditor` edits a text box's words where they're
  drawn, the caret where the click was. The core's box editing (`beginBoxDrag`,
  `dragBox`, `resizeBox`, `fitBoxTo`, `boxPressAt`) is what a text tool does
  with a press: a handle resizes with the opposite edge kept, the outline
  moves, the inside edits, and outside draws a new box. `caretRangeAt` finds
  the caret at a click. Pixels and Shaper share them.

- **Graphs:** `NodeGraph` draws nodes, their input ports and the edges
  between them in columns by depth from its sources, such as an SVG
  filter's primitives. Connect from a port's menu or by dragging from an
  output.

- **The timeline:** `Timeline` (frames, keyframes, tweens, spans, markers,
  playback bounds, the rate and time-signature tools), played on greese.js,
  with `TweenPanel`, `MarkerPanel` and `AuthoringView`, a whole editor.

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

### The authoring theme

Wrap an editor app in `<AuthoringTheme>` (it renders no box of its own) so it
draws its controls as every authoring app does: dense text fields, selects and
comboboxes, and field names in the code face (ADR 0044).

```tsx
<ThemeProvider>
  <AuthoringTheme>
    <Editor />
  </AuthoringTheme>
</ThemeProvider>
```

### Panel breakpoints

A panel is as wide as it's dragged, whatever the window, so what's inside it
answers to the panel. Stack, Grid and AutoLayout take three more keys in any
responsive prop, measured against the panel's body (the `greese-panel`
container): `panelsm` (240px), `panelmd` (320px) and `panellg` (480px).

```tsx
<AutoLayout gap={2}>
  <AutoLayoutItem size={{ xs: 12, panelsm: 6 }}>…</AutoLayoutItem>
  <AutoLayoutItem size={{ xs: 12, panelsm: 6 }}>…</AutoLayoutItem>
</AutoLayout>
```

While a panel is resized (a divider, a floating panel's grip), a status bar
along its foot shows its width × height and the key in effect (ADR 0043).

## Entry points

| Entry                          | What                                                     | Needs        |
| ------------------------------ | -------------------------------------------------------- | ------------ |
| `@greese/authoring`            | Components, hooks, the environment; and everything below | React, Redux |
| `@greese/authoring/core`       | The layout tree, `LayoutSpec`, drag geometry, ids        | nothing      |
| `@greese/authoring/state`      | The store factory, slices and selectors                  | Redux        |
| `@greese/authoring/styles.css` | The styles, in `@layer greese.components`                | –            |

## Licence

MIT
