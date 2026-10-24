/**
 * The built-in effects of the `greese` prop: the one place they are defined.
 *
 * - **Base effects** animate one property each (opacity, scale, a translation,
 *   a filter…) and take optional parameters: `start`, `end` and whatever else
 *   they need, each with a default. `fadeIn` fades from 0 to 1; `fadeIn(0.25,
 *   0.8)` or `fadeIn({ end: 0.8 })` changes that.
 * - **Combo effects** are made of base effects, by name (typed against
 *   `baseEffects`), each placed in time as a share of the combo: `popIn` is
 *   `pop` plus a `fadeIn` over its first 60%.
 *
 * Every call also takes the timing keys `duration` and `offset` (seconds) and
 * `ease`, after the effect's own parameters when given by position:
 * `someEffect(start, end, duration, offset, ease)`.
 *
 * Nothing else lists the effects. The runtime plays what this file says; the
 * build writes every effect that ends at the element's resting state as CSS
 * (`@keyframes greese-<name>`) and every one that ends away from it as an
 * overlay exit (`dist/_maps.scss`); the name types and Theme Studio's lists are
 * derived; an effect Studio defines is turned into the same CSS by the same
 * `cssPlan()`. To add an effect, add it here.
 *
 * Its modules (effects/) import nothing but each other and `kebab.ts` (which
 * imports nothing, so the runtime chunk carries no tokens): the build script
 * runs them directly under Node's type stripping.
 */

export {
  baseEffects,
  builtInEffects,
  comboEffects,
  cssReach,
  effectDirections,
  effectNames,
  isBuiltInEffect,
  jsReach,
  negate,
  timingKeys,
  type BaseArgs,
  type BaseEffect,
  type BuiltInEffect,
  type ComboEffect,
  type EffectFrames,
  type Reach,
  type Timing,
} from './effects/definitions.ts'
export { effectFrames, effectParamNames } from './effects/frames.ts'
export {
  parseSequence,
  splitTiming,
  type EffectCall,
  type EffectStep,
} from './effects/sequence.ts'
export {
  cssPlan,
  effectClass,
  effectCss,
  effectPlan,
  endsHidden,
  entranceNames,
  exitNames,
  toCssSteps,
  type CssPlan,
  type CssStep,
} from './effects/css.ts'
