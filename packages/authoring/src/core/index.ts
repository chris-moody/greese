/**
 * `@greese/authoring/core`: the editor framework's types and pure helpers,
 * with no React and no Redux. The docking layout tree and its `LayoutSpec`,
 * drop-zone geometry, the press-and-drag primitive, and ids.
 */
export {
  buildDefaultTree,
  buildFromSpec,
  EMPTY_TREE,
  makeLeaf,
  makeReservedLeaf,
  makeSplit,
  type BuildDefaultTreeOptions,
} from './layoutTree.construction.ts'
export {
  addTabToLeaf,
  appendToZone,
  ensureReservedLeaves,
  insertAtContainerEdge,
  insertPanel,
  mergeUnknownPanels,
  moveTab,
  pruneUnknownPanels,
  removePanel,
  removeTabFromLeaf,
  reorderTab,
  replaceTabInLeaf,
  resizeSplitNode,
  setLeafActiveTab,
  setLeafCollapsed,
} from './layoutTree.mutations.ts'
export {
  collectPanelIds,
  extractPanelIds,
  findLeafByPanelId,
  findNodeById,
  findParent,
  isReservedLeaf,
  resolveDropZone,
} from './layoutTree.queries.ts'
export {
  DropZone,
  PanelArea,
  RESERVED_STAGE_ID,
  RESERVED_TIMELINE_ID,
  type DropTarget,
  type FloatingPanelState,
  type LayoutSpec,
  type LayoutSpecChild,
  type PanelSlot,
  type ZoneLeaf,
  type ZoneNode,
  type ZoneSplit,
  type ZoneTree,
} from './layoutTree.types.ts'
export {
  beginPointerDrag,
  type PointerDownLike,
  type PointerDragDelta,
  type PointerDragOptions,
} from './pointerDrag.ts'
export { contextMenuPoint } from './contextMenu.ts'
export { uid } from './uid.ts'
export * from './types/tree.types.ts'
export * from './types/timing.types.ts'
export * from './types/resolution.types.ts'
export * from './types/tween.types.ts'
export * from './types/frame.types.ts'
export * from './types/layer.types.ts'
export * from './types/library.types.ts'
export * from './types/playback.types.ts'
export * from './types/project.types.ts'
export * from './stage/renderObject.types.ts'
export * from './stage/viewportMath.ts'
export * from './timeline/ticks.ts'
export * from './timeline/timingModel.ts'
export * from './timeline/levelEditor.types.ts'
export * from './timeline/resolutions/index.ts'
export * from './tree/hierarchicalList.ts'
export * from './layers/layers.ts'
export * from './dnd.ts'
export * from './search/searchProvider.types.ts'
export * from './search/FuzzySearchProvider.ts'
export * from './search/PrefixSearchProvider.ts'
export * from './search/ExactSearchProvider.ts'
export { ROW_HEIGHT } from './constants.ts'
export * from './types/config.types.ts'
export * from './library/layerTypes.ts'
export * from './library/libraryAssetKind.ts'
export * from './library/libraryTree.ts'
export * from './library/symbolNaming.ts'
export * from './tools/tools.ts'
export * from './paint/distinguishingColors.ts'
export * from './paint/gradient.ts'
export * from './code/highlight.ts'
export * from './timeline/tween.ts'
export * from './timeline/curvePresets.ts'
export * from './timeline/bezierPresets.ts'
export * from './timeline/levelEditor.ts'
export * from './timeline/spanPlayback.ts'
export * from './timeline/rulerTiers.ts'
export * from './timeline/spanChart.types.ts'
export * from './keyboard.ts'
export {
  DEFAULT_FRAME_WIDTH,
  LABEL_WIDTH,
  MAX_FRAME_WIDTH,
  MIN_FRAME_WIDTH,
  RULER_HEIGHT,
} from './constants.ts'
