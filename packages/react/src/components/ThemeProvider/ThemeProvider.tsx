'use client'
import {
  createContext,
  use,
  useMemo,
  type ComponentPropsWithoutRef,
  type JSX,
  type Ref,
} from 'react'
import type { ColorScheme, Theme } from '@greese/ui'
import { cx } from '../../utils/cx.ts'
import { Slot } from '../Slot/Slot.tsx'

interface ThemeScope {
  theme?: string
  scheme?: ColorScheme
}

const ThemeScopeContext = createContext<ThemeScope>({})

/** The nearest ThemeProvider's theme name and forced scheme, if any. */
export const useThemeScope = (): ThemeScope => use(ThemeScopeContext)

export interface ThemeProviderProps extends ComponentPropsWithoutRef<'div'> {
  /** The wrapper `<div>`, or your element with `asChild`. */
  ref?: Ref<HTMLElement>
  /**
   * A theme from `createTheme()`, or the name of one whose CSS you load
   * yourself, such as a theme compiled with the SCSS kit's `theme()`. Omit to
   * only set a scheme.
   */
  theme?: Theme | string
  /** Force `light` or `dark` for this subtree, or `system` to follow the OS. */
  scheme?: ColorScheme
  /** Scope your own element instead of rendering a wrapper. */
  asChild?: boolean
}

/**
 * Scopes a theme and/or colour scheme to its subtree.
 *
 * Costs nothing per render: the theme's CSS is static (built once by
 * `createTheme`) and React hoists and de-duplicates it into `<head>`; the
 * wrapper only carries two attributes. Nested providers inherit what they
 * don't set, so a scheme override inside a theme keeps the theme.
 *
 * The wrapper is `display: contents`, so it never affects layout.
 */
export const ThemeProvider = ({
  theme,
  scheme,
  asChild,
  className,
  children,
  ...props
}: ThemeProviderProps): JSX.Element => {
  const parent = use(ThemeScopeContext)
  const themeName = (typeof theme === 'string' ? theme : theme?.name) ?? parent.theme
  // Stamp the inherited scheme too: theme rules resolve on this element alone,
  // so it must carry both attributes (see createTheme's CSS).
  const resolvedScheme = scheme ?? parent.scheme
  const scope = useMemo(
    () => ({ theme: themeName, scheme: resolvedScheme }),
    [themeName, resolvedScheme]
  )

  // Typed as Slot: its HTMLElement ref and props are the common denominator of
  // a <div> and whatever element asChild receives.
  const Root = (asChild ? Slot : 'div') as typeof Slot
  return (
    <ThemeScopeContext value={scope}>
      {typeof theme === 'object' && (
        <style href={`greese-theme-${theme.name}`} precedence="greese">
          {theme.css}
        </style>
      )}
      <Root
        {...props}
        className={cx(!asChild && 'greese-ThemeProvider', className)}
        data-greese-theme={themeName}
        data-greese-scheme={resolvedScheme}
      >
        {children}
      </Root>
    </ThemeScopeContext>
  )
}
