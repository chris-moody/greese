import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '@greese/react'

export type AuthoringThemeProps = ComponentPropsWithRef<'div'>

/**
 * The default authoring theme, for a whole editor app: wrap the app (or each
 * editor's shell) in it, so every authoring app draws its controls alike.
 * Inside it, text fields, selects, comboboxes and textareas are dense: one
 * asked for at `md` or larger is drawn at `sm`. It renders no box of its own
 * (`display: contents`), so a shell's flex or grid layout is untouched, and it
 * composes with any greese theme or scheme around it.
 *
 * ```tsx
 * <ThemeProvider>
 *   <AuthoringTheme>
 *     <MyEditor />
 *   </AuthoringTheme>
 * </ThemeProvider>
 * ```
 *
 * Its rules are in `@greese/authoring/styles.css`. An editor that renders
 * its own root can put `greese-AuthoringTheme` on it instead, as Shaper does.
 */
export const AuthoringTheme = ({
  className,
  ...props
}: AuthoringThemeProps): JSX.Element => (
  <div
    {...props}
    className={cx('greese-AuthoringTheme', 'greese-AuthoringTheme--contents', className)}
  />
)
