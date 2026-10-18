export * from './components/index.ts'
export * from './hooks/index.ts'
export { configureBreakpoints, getBreakpoints } from './utils/breakpoints.ts'
export { cx } from './utils/cx.ts'
export {
  computeFallbackPosition,
  positionArea,
  useAnchoredPopover,
  type AnchoredPopover,
  type Placement,
} from './utils/anchor.ts'
export type { BoxStyleProps, Display } from './utils/styleProps.ts'
export {
  isSpaceToken,
  neverToken,
  resolveResponsive,
  responsiveClass,
  responsivePropClass,
  responsiveVar,
  spaceToCss,
  type ResolvedResponsive,
  type Responsive,
  type ResponsiveConfig,
  type ResponsiveEntry,
  type ResponsiveValue,
  type SpaceValue,
} from './utils/responsive.ts'
export {
  breakpoints,
  createTheme,
  getSchemeScript,
  type Breakpoint,
  type ColorRole,
  type ColorScheme,
  type ColorValue,
  type SchemeScriptOptions,
  type SpaceToken,
  type Theme,
  type ThemeOptions,
} from '@greese-ui/tokens'

// greese.js, bundled: the animation library (@greese-ui/greese), re-exported so
// one install covers both. Tree-shaken away when unused.
export {
  animate,
  cubicBezier,
  ease,
  splitText,
  timeline,
  Timeline,
  type AnimateOptions,
  type Ease,
  type Keyframe,
  type Keyframes,
  type Position,
  type SplitText,
  type StaggerOptions,
  type TimelineOptions,
} from '@greese-ui/greese'
