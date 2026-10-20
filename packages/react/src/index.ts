export * from './components/index.ts'
export * from './hooks/index.ts'
export {
  configureBreakpoints,
  getBreakpointKeys,
  getBreakpoints,
} from './utils/breakpoints.ts'
export { cx } from './utils/cx.ts'
export {
  cssEase,
  resolveGreese,
  withGreese,
  type GreeseEffectName,
  type GreeseEffectRegistry,
  type GreeseExit,
  type GreeseInteraction,
  type GreeseMotion,
  type GreeseOptions,
  type GreeseScope,
  type GreesePreset,
  type GreeseProp,
  type GreeseProps,
  type GreeseSequence,
  type GreeseTextEffect,
  type ResolvedGreese,
} from './utils/greese.ts'
export {
  defineGreeseEffect,
  type GreeseEffect,
  type GreeseEffectContext,
  type GreeseEffectKeyframes,
  type GreeseEffectWithDefaults,
} from './components/Motion/effects.ts'
export {
  computeFallbackPosition,
  positionArea,
  useAnchoredPopover,
  type AnchoredPopover,
  type Placement,
} from './utils/anchor.ts'
export type { BoxStyleProps, Display } from './utils/styleProps.ts'
export type { BrandTone } from './utils/tone.ts'
export {
  isSpaceToken,
  neverToken,
  resolveResponsive,
  responsiveClass,
  responsiveValueClass,
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
  type TypeVariant,
  type ColorRole,
  type ColorScheme,
  type ColorValue,
  type SchemeScriptOptions,
  type SpaceToken,
  type Theme,
  type ThemeOptions,
} from '@greese/ui'

// greese.js, bundled: the animation library (@greese/js), re-exported so
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
} from '@greese/js'
