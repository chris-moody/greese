import { lazy, Suspense, useEffect, useMemo, useState, type JSX } from 'react'
import { ThemeProvider, Toaster, useStoredState, type Theme } from '@greese/react'
import { Home } from './pages/Home.tsx'
import { Nav } from './sections/Nav.tsx'
import { RouteContext, ScrollOnRoute, useRoute } from './router.tsx'
import { ShellContext, type Shell, type StudioActions } from './shell.ts'
import { isSpec, stored, WORN } from './studio/storage.ts'
import { migrateSpec } from './studio/migrate.ts'
import type { RenderedColors } from './studio/protocol.ts'
import type { ThemeSpec } from './studio/spec.ts'
import { applyEffects } from './effects-runtime.ts'
import { brand, GREESE_SPEC } from './theme.ts'

// The studio is its own chunk: the homepage never loads its editor, the
// compiler or the importer.
const StudioPage = lazy(() =>
  import('./studio/StudioPage.tsx').then((m) => ({ default: m.StudioPage }))
)
const Templates = lazy(() =>
  import('./pages/Templates.tsx').then((m) => ({ default: m.Templates }))
)

const GREESE_JSON = JSON.stringify(GREESE_SPEC)

/**
 * The theme every page wears: the site's own until a visitor picks or edits
 * another, which is built from the spec when it's first needed.
 */
const useSiteTheme = (spec: ThemeSpec): Theme => {
  const [built, setBuilt] = useState<Theme>()
  useEffect(() => {
    if (JSON.stringify(spec) === GREESE_JSON) return setBuilt(undefined)
    let live = true
    void import('./theme/specTheme.ts').then((m) => live && setBuilt(m.specToTheme(spec)))
    return () => {
      live = false
    }
  }, [spec])
  return built ?? brand
}

// Each shape and motion theme's and color variant's compiled CSS, fetched only when the page wears it.
const THEME_CSS = import.meta.glob<string>('../../../packages/ui/themes/*.css', {
  query: '?inline',
  import: 'default',
})

/**
 * The shape and motion themes and the color variant the page wears (ADR
 * 0025), as stylesheets in the head. The homepage applies a theme's tokens with createTheme, which
 * has no component styles, shapes or effects, so those layers' compiled CSS
 * goes in beside it, on every page: the studio's editor wears the theme
 * too. (Its preview compiles the whole theme itself, edits included.)
 */
const useLayerCss = (spec: ThemeSpec): void => {
  // Anything a layer theme writes: radius roles, component SCSS, shapes,
  // a variant's modifiers and styles, motion roles.
  const layered =
    !!spec.motionDefaults ||
    !!spec.tokens?.corner ||
    Object.values(spec.components ?? {}).some(
      (c) => c.shape || c.motion || c.scss || c.modifiers || c.styles
    )
  const key = layered
    ? JSON.stringify([spec.shapes, spec.components, spec.motionDefaults, spec.effects, spec.tokens?.corner])
    : ''
  useEffect(() => {
    if (!key) return
    let live = true
    const sheets: HTMLStyleElement[] = []
    void Promise.all([
      import('./studio/shapes.ts'),
      import('./studio/motions.ts'),
      import('./studio/variants.ts'),
    ]).then(
      async ([{ shapeIn }, { motionIn }, { variantIn }]) => {
        for (const layer of [shapeIn(spec), motionIn(spec), variantIn(spec)]) {
          if (!layer) continue
          const css = await THEME_CSS[`../../../packages/ui/themes/${layer.id}.css`]?.()
          if (!live || !css) continue
          const sheet = document.createElement('style')
          sheet.dataset.siteTheme = layer.id
          sheet.textContent = css
          document.head.append(sheet)
          sheets.push(sheet)
        }
      }
    )
    return () => {
      live = false
      sheets.forEach((sheet) => sheet.remove())
    }
    // The key stands for the layers' parts of the spec, all this reads.
  }, [key])
}

/**
 * The web app: the homepage at `/`, Theme Studio at `/studio` and the
 * templates at `/templates`, under one header. Every page wears the theme
 * being chosen, the studio's editor included, and keeps it between visits;
 * the studio's preview shows the theme with your edits as well.
 */
export const App = (): JSX.Element => {
  const route = useRoute()
  // The theme being worn, kept between visits: every pick in the theme menu.
  const [spec, setSpec] = useStoredState<ThemeSpec>(WORN, stored() ?? GREESE_SPEC, {
    // A theme worn before themes reassigned roles loses what its old layers overwrote.
    parse: (text) => {
      const value: unknown = JSON.parse(text)
      return isSpec(value) ? migrateSpec(value) : value
    },
    validate: isSpec,
  })
  const [rendered, setRendered] = useState<RenderedColors>()
  const [replay, setReplay] = useState(0)
  const [inspect, setInspect] = useState(false)
  const [studio, setStudio] = useState<StudioActions | null>(null)
  const theme = useSiteTheme(spec)
  useLayerCss(spec)
  // The theme's effects work on this page: the homepage, and the studio's stage.
  const effectsKey = JSON.stringify(spec.effects ?? null)
  useEffect(() => applyEffects(spec.effects), [effectsKey])

  const shell = useMemo<Shell>(
    () => ({
      spec,
      setSpec,
      rendered,
      setRendered,
      replay,
      replayMotion: () => setReplay((n) => n + 1),
      inspect,
      setInspect,
      studio,
      setStudio,
    }),
    [spec, rendered, replay, inspect, studio]
  )

  return (
    <ShellContext value={shell}>
      <RouteContext value={route}>
        <ThemeProvider theme={theme} asChild>
          <div className={`site site--${route}`}>
            <a href="#main" className="site-skip">
              Skip to content
            </a>
            <ScrollOnRoute />
            <Nav />
            {route === 'home' && <Home />}
            {route !== 'home' && (
              <Suspense>{route === 'studio' ? <StudioPage /> : <Templates />}</Suspense>
            )}
            <Toaster />
          </div>
        </ThemeProvider>
      </RouteContext>
    </ShellContext>
  )
}
