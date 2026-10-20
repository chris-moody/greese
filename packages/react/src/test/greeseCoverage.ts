/**
 * Type-level check, run by `check-types`: every exported component accepts
 * the `greese` prop, except those that render nothing of their own to
 * animate. A component missing it fails the build with its name in the error.
 */
import type * as Library from '../index.ts'

/** Components with no visible box of their own: nothing for `greese` to move. */
type Excluded =
  | 'Slot' // passes everything to its child
  | 'Slottable'
  | 'VisuallyHidden' // invisible by design
  | 'Break' // a line break
  | 'Spacer' // empty space
  | 'Show' // display: contents wrappers
  | 'Hide'
  | 'ThemeProvider' // display: contents
  | 'Toaster' // a live region; toasts animate themselves
  | 'Timeline' // greese.js's class, re-exported

type ComponentNames = {
  [K in keyof typeof Library]: K extends `${Uppercase<string>}${string}`
    ? (typeof Library)[K] extends (props: never) => unknown
      ? K
      : never
    : never
}[keyof typeof Library]

type PropsOf<K extends ComponentNames> = (typeof Library)[K] extends (
  props: infer P
) => unknown
  ? P
  : never

type MissingGreese = {
  [K in Exclude<ComponentNames, Excluded>]: 'greese' extends keyof PropsOf<K> ? never : K
}[Exclude<ComponentNames, Excluded>]

// Fails with "Type 'true' is not assignable to type '"<Name>"'" naming each one.
export const everyComponentAcceptsGreese: [MissingGreese] extends [never]
  ? true
  : MissingGreese = true
