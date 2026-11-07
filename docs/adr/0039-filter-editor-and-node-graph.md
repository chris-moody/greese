# ADR 0039: Shaper's filter editor, on a generic NodeGraph

- **Status:** Accepted
- **Date:** 2026-11-07
- **Builds on:** ADR 0035 (`@greese/authoring`), ADR 0037 (Shaper's document
  model), ADR 0038 (Shaper)

## Context

Phase 5 of the authoring and Shaper plan is a filter editor. An SVG
`<filter>` is a graph: each primitive reads one or two inputs (`in`, `in2`,
or an `feMergeNode` each) and writes a `result` that later primitives name.
Shaper's library lists filters, but nothing could edit one: the properties
panel showed `filter="url(#id)"` as plain text.

The plan asked for the graph to be a generic authoring component, and named
Amp's `PipelinePanel` (in Glop) as its second user. Amp's pipeline is a
strictly linear chain: an ordered array of processors, each with an `enabled`
switch, its own parameter card, and drag to reorder. It has no ports or
wiring, and its reordering has no keyboard path.

## Decision

### `NodeGraph` in `@greese/authoring`

A controlled component that draws nodes, their input ports and the edges
between them. It owns no document: the host passes the graph and applies
each change it reports.

- **Data:** `nodes` (`id`, `label`, `inputs`: port names, `output`: whether
  it has one, `bypassed`), `sources` (fixed terminals: `SourceGraphic`, an
  audio input) and `edges` (`from` a node or source, `to` a node, `port`).
- **Layout is computed, not dragged:** nodes in columns by depth from the
  sources, in their given order within a column. A filter's primitives are
  ordered (a result is only visible to later primitives), so their order
  is the document's, and the layout is deterministic for tests and
  screenshots. `layout="chain"` (one column, implicit edges) is reserved for
  Amp and not built yet.
- **Connecting:** drag from an output to an input port, or, from the
  keyboard, choose the input's source from its port's menu. Both report
  `onConnect({ from, to, port })`. An input can be cleared
  (`onDisconnect`).
- **Selection and removal:** one selected node (`selected`, `onSelect`),
  with arrow keys moving between nodes and Delete reporting `onRemove`.
- **Accessibility:** the graph is a `group` with a name, and so is each node,
  so a port is heard with its node. Node headers share one tab stop (arrows,
  Home and End move it; the selected one is `aria-current`), and the ports of
  the node holding it follow it in the tab order. Each port is a menu button
  naming the input and its current source ("in: SourceGraphic"); its menu
  lists every valid origin and Disconnect. Edges are decoration
  (`aria-hidden`): every connection can be read from, and set on, its port.
- **Rendering:** `renderNode(node)` puts a host's own body under the node's
  header (Amp's parameter card later); edges are one SVG behind the nodes.

### The filter editor in Shaper

- **A dialog**, opened from a filter's Edit button in the library, from an
  Edit button beside a `filter` attribute in Properties, or by New filter.
  The view slice holds which filter is open (`filterEditor`), so any panel
  can open it.
- **The model is pure** (`apps/shaper/src/model/filter.ts`): read a
  `<filter>` into nodes and edges (an omitted `in` is the previous
  primitive's result, or `SourceGraphic` for the first), connect (naming a
  `result` where one is needed), add, remove (rewiring what read the removed
  primitive to what it read), insert a preset from `@greese/svg`, and cut
  the filter at a primitive for its preview.
- **Fields come from the schema** (`@greese/svg/schema`): the selected
  primitive's own attributes, and the filter's region (`x`, `y`, `width`,
  `height`, `filterUnits`, `primitiveUnits`).
- **The preview** draws the selected element, or a sample shape, through the
  filter in a small SVG built the way the stage builds the drawing (DOM
  nodes, never markup). With a primitive selected, it shows the result up to
  that primitive.
- **Edits are undoable,** one step per gesture or field visit, like the
  rest of Shaper.

## Consequences

- `@greese/authoring` gains `NodeGraph`, with a story, tests and a size
  budget. Amp can adopt it once `layout="chain"` exists; its card body and
  bypass switch fit `renderNode` and `bypassed`.
- Free node positions (dragging a node anywhere) are left out: computed
  columns are enough for filters of a dozen primitives, and positions would
  need storing somewhere a `<filter>` has no room for.
- `feImage`, `feTile`, lighting primitives and `feComponentTransfer`'s
  function children get the schema's generic fields only.
