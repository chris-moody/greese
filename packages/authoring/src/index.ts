/**
 * @greese/authoring: editor UI for greese. A dockable panel workspace with
 * layout specs and a layout cache, on a Redux store per editor. It
 * re-exports `@greese/authoring/core` and `@greese/authoring/state`, so an
 * editor can import everything from here. Import the styles once:
 * `import '@greese/authoring/styles.css'`, after greese ui's.
 */
export * from './core/index.ts'
export * from './state/index.ts'
export { HierarchicalList } from './components/HierarchicalList/HierarchicalList.tsx'
export { HierarchicalListFolder } from './components/HierarchicalList/HierarchicalListFolder.tsx'
export { HierarchicalListItem } from './components/HierarchicalList/HierarchicalListItem.tsx'
export type {
  HierarchicalListFolderProps,
  HierarchicalListItemProps,
  HierarchicalListProps,
  RowRenderProps,
} from './components/HierarchicalList/hierarchicalList.types.ts'
export { LayerTree, type LayerTreeProps } from './components/LayerTree/LayerTree.tsx'
export {
  LayerTreeItem,
  type LayerTreeItemProps,
} from './components/LayerTree/LayerTreeItem.tsx'
export {
  LibraryAssetItem,
  type LibraryAssetItemProps,
} from './components/Library/LibraryAssetItem.tsx'
export {
  LibraryPanel,
  type LibraryPanelProps,
} from './components/Library/LibraryPanel.tsx'
export {
  SymbolCreateDialog,
  type SymbolCreateDialogProps,
  type SymbolTypeOption,
} from './components/Library/SymbolCreateDialog.tsx'
export {
  EditableSelect,
  unitOptions,
  type EditableSelectOption,
  type EditableSelectProps,
} from './components/EditableSelect/EditableSelect.tsx'
export {
  GRID_INTERVAL_PRESETS,
  GridControl,
  LayoutBar,
  StageBar,
  StageColorControl,
  ZOOM_PRESETS,
  ZoomControl,
  type GridControlProps,
  type LayoutBarProps,
  type StageBarLayoutOption,
  type StageBarProps,
  type StageColorControlProps,
  type ZoomControlProps,
} from './components/StageBar/StageBar.tsx'
export {
  GuidePropertiesDialog,
  type GuidePropertiesDialogProps,
} from './components/Guides/GuidePropertiesDialog.tsx'
export {
  GuidesOverlay,
  type GuidesOverlayProps,
} from './components/Guides/GuidesOverlay.tsx'
export { PanelDock, type PanelDockProps } from './components/PanelDock/PanelDock.tsx'
export {
  AuthoringBreadcrumbs,
  type AuthoringBreadcrumbsProps,
  type BreadcrumbAccent,
} from './components/Stage/Breadcrumbs.tsx'
export { RulerToggle, type RulerToggleProps } from './components/Stage/RulerToggle.tsx'
export { StageContext, type StageContextProps } from './components/Stage/StageContext.tsx'
export { StageHost, type StageHostProps } from './components/Stage/StageHost.tsx'
export {
  RULER_SIZE,
  StageRulers,
  type StageRulersProps,
} from './components/Stage/StageRulers.tsx'
export type { PanelRegistrant } from './components/PanelDock/panel.types.ts'
export {
  createAuthoringEnvironment,
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
  type AuthoringEnvironment,
  type AuthoringEnvironmentOptions,
} from './environment/environment.tsx'
export {
  useHistory,
  useUndoRedoKeymap,
  type HistoryControls,
} from './hooks/useHistory.ts'
export {
  useInitialWorkspace,
  useLayoutCache,
  usePanelListFromSpec,
  type LayoutCache,
} from './hooks/layout.ts'
export * from './environment/media.types.ts'
export { deserializeProject, serializeProject } from './environment/serialize.ts'
export { buildToolCursorCss } from './environment/toolCursorCss.ts'
export {
  applySelection,
  backendReconciles,
  indexLayerTypes,
  reconcileObjects,
  resolveEditInPlaceTransition,
  sampleLayers,
  type EditInPlaceTransition,
  type SampleLayersOptions,
} from './core/stage/stageDriver.ts'
export { useCreateInstance } from './hooks/useCreateInstance.ts'
export { useNavigation } from './hooks/useNavigation.ts'
export { useStageDriver } from './hooks/useStageDriver.ts'
export {
  useSymbolCreateNaming,
  type SymbolCreateNaming,
} from './hooks/useSymbolCreateNaming.ts'
export { Toolbar, type ToolbarProps } from './components/Toolbar/Toolbar.tsx'
export {
  ToolbarItem,
  type ToolbarItemProps,
  type ToolDefinition,
} from './components/Toolbar/ToolbarItem.tsx'
export {
  ToolOptionsPanel,
  type ToolOptionsPanelProps,
} from './components/ToolOptions/ToolOptionsPanel.tsx'
export { useToolHotkeys, type UseToolHotkeysOptions } from './hooks/useToolHotkeys.ts'
export { createToolCursors, type ToolCursor } from './environment/toolCursors.ts'
export { AccentIcon, type AccentIconProps } from './components/Navigation/AccentIcon.tsx'
export {
  EnvironmentSelect,
  type EnvironmentOption,
  type EnvironmentSelectProps,
} from './components/Navigation/EnvironmentSelect.tsx'
export { NavBar, type NavBarProps } from './components/Navigation/NavBar.tsx'
export {
  NavHistory,
  type NavHistoryEntry,
  type NavHistoryProps,
} from './components/Navigation/NavHistory.tsx'
export {
  PropertyGrid,
  type PropertyGridProps,
} from './components/PropertyGrid/PropertyGrid.tsx'
export {
  GradientStopBar,
  type GradientStopBarProps,
} from './components/Gradient/GradientStopBar.tsx'
export {
  GradientEditor,
  type GradientEditorProps,
} from './components/Gradient/GradientEditor.tsx'
export {
  ComplexColorField,
  type ComplexColorFieldProps,
} from './components/Gradient/ComplexColorField.tsx'
export {
  ToggleSelect,
  type ToggleSelectOption,
  type ToggleSelectProps,
} from './components/ToggleSelect/ToggleSelect.tsx'
export {
  CodeEditor,
  Highlighted,
  type CodeEditorProps,
  type HighlightedProps,
} from './components/CodeEditor/CodeEditor.tsx'
export { Timeline, type TimelineProps } from './timeline/Timeline/Timeline.tsx'
export {
  TimelineHeader,
  type TimelineHeaderProps,
} from './timeline/TimelineHeader/TimelineHeader.tsx'
export {
  TimelinePanel,
  type TimelinePanelProps,
} from './timeline/TimelinePanel/TimelinePanel.tsx'
export {
  TimelineLevelEditor,
  type TimelineLevelEditorProps,
} from './timeline/levelEditor/TimelineLevelEditor.tsx'
export {
  SpanActivityChart,
  type SpanActivityChartProps,
} from './timeline/spanChart/SpanActivityChart.tsx'
export {
  mapAdapterResultToChartGeometry,
  useSpanChartGeometry,
  type SpanChartGeometry,
  type SpanChartLineGeometry,
  type SpanChartRowGeometry,
} from './timeline/spanChart/spanChartGeometry.ts'
export { TweenPanel } from './panels/TweenPanel/TweenPanel.tsx'
export { MarkerPanel } from './panels/MarkerPanel/MarkerPanel.tsx'
export {
  AuthoringView,
  type AuthoringViewProps,
} from './components/AuthoringView/AuthoringView.tsx'
export {
  LayerContextMenu,
  type LayerContextMenuProps,
} from './components/LayerTree/LayerContextMenu.tsx'
export { usePlaybackClock } from './timeline/usePlaybackClock.ts'
export {
  PULSE_DECAY_MS,
  usePulseClock,
  type PulseClockHandle,
  type PulseEntry,
} from './timeline/usePulseClock.ts'
export { useTimelineEditing } from './timeline/useTimelineEditing.ts'
export { useTimelineKeymap } from './timeline/useTimelineKeymap.ts'
export { useTimelineResolution } from './timeline/useTimelineResolution.ts'
export {
  autoKeyframeAction,
  autoKeyframesAction,
  autoKeyframeSource,
} from './timeline/autoKeyframe.ts'
export {
  useLevelEditorInteractions,
  type LevelEditorInteractions,
  type LevelEditorMarquee,
} from './timeline/levelEditor/useLevelEditorInteractions.ts'
export { useLevelEditorEditing } from './timeline/levelEditor/useLevelEditorEditing.ts'
export { useHoldRepeat, type HoldRepeatOptions } from './hooks/useHoldRepeat.ts'
