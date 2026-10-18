import type { JSX, ReactNode } from 'react'
import {
  createTheme,
  ThemeProvider,
  useColorScheme,
  VisuallyHidden,
  type ColorScheme,
} from '@greese-ui/react'
import '@greese-ui/react/base.css'
import '@greese-ui/react/styles.css'

const brand = createTheme({
  name: 'brand',
  color: { accent: { light: '#7c3aed', dark: '#c4b5fd' }, surface: '#fef3c7' },
})
const rounded = createTheme({ name: 'rounded', radius: { md: '2px' } })

/**
 * Exposes the resolved tokens at this point in the tree for e2e assertions.
 * A decorative swatch, not text: the fixture themes mix colours on purpose,
 * and the tests read computed styles.
 */
const Probe = ({ id, children }: { id: string; children?: ReactNode }) => (
  <div>
    <div
      data-testid={id}
      aria-hidden="true"
      style={{
        blockSize: '1.5rem',
        color: 'var(--greese-color-accent)',
        backgroundColor: 'var(--greese-color-surface)',
        borderRadius: 'var(--greese-radius-md)',
      }}
    />
    {children}
  </div>
)

const SchemeControls = () => {
  const { scheme, resolvedScheme, setScheme } = useColorScheme()
  return (
    <fieldset>
      <legend>
        Page scheme: <output data-testid="scheme">{scheme}</output> (
        <output data-testid="resolved">{resolvedScheme}</output>)
      </legend>
      {(['light', 'dark', 'system'] as ColorScheme[]).map((s) => (
        <button key={s} type="button" onClick={() => setScheme(s)}>
          {s}
        </button>
      ))}
    </fieldset>
  )
}

/** Smoke and theming fixtures for e2e/smoke.spec.ts and e2e/theming.spec.ts. */
export const Theming = (): JSX.Element => (
  <main>
    <h1>GreeseUI playground</h1>
    <button type="button" data-testid="icon-button">
      <span aria-hidden="true">×</span>
      <VisuallyHidden>Close</VisuallyHidden>
    </button>

    <SchemeControls />

    <Probe id="default" />
    <ThemeProvider scheme="dark">
      <Probe id="plain-dark" />
    </ThemeProvider>

    <ThemeProvider theme={brand}>
      <Probe id="brand">
        <ThemeProvider scheme="dark">
          <Probe id="brand-dark">
            <ThemeProvider theme={rounded}>
              <Probe id="rounded-in-dark" />
            </ThemeProvider>
            <ThemeProvider scheme="light">
              <Probe id="brand-light-in-dark" />
            </ThemeProvider>
          </Probe>
        </ThemeProvider>
      </Probe>
    </ThemeProvider>

    <ThemeProvider theme={brand} scheme="system">
      <Probe id="brand-system" />
    </ThemeProvider>
  </main>
)
