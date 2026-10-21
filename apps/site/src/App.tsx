import { lazy, Suspense, useEffect, useMemo, useState, type JSX } from 'react'
import { ThemeProvider, Toaster, type Theme } from '@greese/react'
import { Home } from './pages/Home.tsx'
import { Nav } from './sections/Nav.tsx'
import { RouteContext, ScrollOnRoute, useRoute } from './router.tsx'
import { ShellContext, type Shell, type StudioActions } from './shell.ts'
import { stored } from './studio/storage.ts'
import type { RenderedColors } from './studio/protocol.ts'
import type { ThemeSpec } from './studio/spec.ts'
import { applyEffects } from './effects-runtime.ts'
import { brand, GREESE_SPEC } from './theme.ts'

// The studio is its own chunk: the homepage never loads its editor, the
// compiler or the importer.
const StudioPage = lazy(() =>
  import('./studio/StudioPage.tsx').then((m) => ({ default: m.StudioPage }))
)

const GREESE_JSON = JSON.stringify(GREESE_SPEC)

/**
 * The theme the homepage wears: the site's own until a visitor picks or edits
 * another, which is built from the spec when it's first needed.
 */
const useHomeTheme = (spec: ThemeSpec): Theme => {
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

/**
 * The web app: the homepage at `/` and Theme Studio at `/studio`, under one
 * header. The page wears the theme being chosen; the studio's editor and
 * header stay on GreeseUI's defaults, so editing a theme restyles only its
 * preview.
 */
export const App = (): JSX.Element => {
  const route = useRoute()
  const [spec, setSpec] = useState<ThemeSpec>(() => stored() ?? GREESE_SPEC)
  const [rendered, setRendered] = useState<RenderedColors>()
  const [replay, setReplay] = useState(0)
  const [inspect, setInspect] = useState(false)
  const [studio, setStudio] = useState<StudioActions | null>(null)
  const theme = useHomeTheme(spec)
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
        <ThemeProvider theme={route === 'home' ? theme : undefined} asChild>
          <div className={`site site--${route}`}>
            <a href="#main" className="site-skip">
              Skip to content
            </a>
            <ScrollOnRoute />
            <Nav />
            {route === 'home' ? (
              <Home />
            ) : (
              <Suspense>
                <StudioPage />
              </Suspense>
            )}
            <Toaster />
          </div>
        </ThemeProvider>
      </RouteContext>
    </ShellContext>
  )
}
