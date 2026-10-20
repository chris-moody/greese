import { StrictMode, useEffect, useState, type JSX } from 'react'
import { createRoot } from 'react-dom/client'
import {
  configureBreakpoints,
  Container,
  resetBreakpoints,
  Stack,
  ThemeProvider,
  type ColorScheme,
} from '@greese/react'
import '@greese/react/base.css'
import baseStyles from '@greese/react/styles.css?inline'
import type { FromPreview, ToPreview } from '../protocol.ts'
import { ComponentPreview } from './ComponentPreview.tsx'
import { Gallery } from './Gallery.tsx'
import { inspector } from './inspect.ts'
import { color } from '@greese/ui'
import { measureColors } from './measure.ts'
import './preview.css'

const post = (message: FromPreview) => window.parent.postMessage(message, location.origin)
const themeStyle = document.getElementById('theme')!
// The prebuilt stylesheet, as text: it's dropped when the theme brings a
// whole one, built for its own breakpoints.
const baseStyle = document.head.insertBefore(document.createElement('style'), themeStyle)
baseStyle.textContent = baseStyles

/** The colors a theme's CSS adds: `--greese-color-<name>` the system has no role for. */
const addedColors = (css: string): string[] => [
  ...new Set(
    [...css.matchAll(/--greese-color-([a-z0-9-]+)\s*:/g)]
      .map((m) => m[1]!)
      .filter((name) => !(name in kebabRoles))
  ),
]
const kebabRoles = Object.fromEntries(
  Object.keys(color).map((role) => [
    role.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
    1,
  ])
)
const highlight = document.head.appendChild(document.createElement('style'))
const setInspecting = inspector((picked) => post({ type: 'pick', ...picked }))

const Preview = (): JSX.Element => {
  const [scope, setScope] = useState<{ theme?: string; scheme: ColorScheme }>({
    scheme: 'system',
  })
  const [run, setRun] = useState(0)
  const [feature, setFeature] = useState('Button')

  useEffect(() => {
    const onMessage = (event: MessageEvent<ToPreview>) => {
      if (event.origin !== location.origin) return
      const message = event.data
      if (message.type === 'css') {
        baseStyle.textContent = message.full ? '' : baseStyles
        resetBreakpoints()
        if (message.breakpoints) configureBreakpoints(message.breakpoints)
        themeStyle.textContent = message.css
        setCss((n) => n + 1)
      }
      if (message.type === 'scope')
        setScope({ theme: message.theme, scheme: message.scheme })
      if (message.type === 'inspect') setInspecting(message.on)
      if (message.type === 'replay') setRun((n) => n + 1)
      if (message.type === 'feature') setFeature(message.block)
      if (message.type === 'highlight')
        highlight.textContent = message.block
          ? `.greese-${message.block} { outline: 2px dashed var(--studio-pick) !important; outline-offset: 2px; }`
          : ''
    }
    window.addEventListener('message', onMessage)
    post({ type: 'ready' })
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // The page's scheme lives on <html>, as useColorScheme sets it, so
  // page-level token overrides (`:root`) resolve as they will in an app.
  useEffect(() => {
    document.documentElement.dataset.greeseScheme = scope.scheme
  }, [scope.scheme])

  // After every theme change, report what each color role really renders as,
  // so the studio's chips and swatches show the truth.
  const [css, setCss] = useState(0)
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      post({
        type: 'colors',
        ...measureColors(
          document,
          scope.theme,
          addedColors(themeStyle.textContent ?? '')
        ),
      })
    )
    return () => cancelAnimationFrame(frame)
  }, [css, scope.theme])

  return (
    <ThemeProvider theme={scope.theme} asChild>
      <div className="studio-preview-root">
        <Container size="lg" key={run} className="studio-preview">
          <Stack gap={7}>
            <ComponentPreview block={feature} />
            <Gallery />
          </Stack>
        </Container>
      </div>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Preview />
  </StrictMode>
)
