import { StrictMode, useEffect, useState, type JSX } from 'react'
import { createRoot } from 'react-dom/client'
import { Container, Stack, ThemeProvider, type ColorScheme } from '@greese/react'
import '@greese/react/base.css'
import '@greese/react/styles.css'
import type { FromPreview, ToPreview } from '../protocol.ts'
import { ComponentPreview } from './ComponentPreview.tsx'
import { Gallery } from './Gallery.tsx'
import { inspector } from './inspect.ts'
import { measureColors } from './measure.ts'
import './preview.css'

const post = (message: FromPreview) => window.parent.postMessage(message, location.origin)
const themeStyle = document.getElementById('theme')!
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
      post({ type: 'colors', ...measureColors(document, scope.theme) })
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
