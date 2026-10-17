import type { JSX, ReactNode } from 'react'
import {
  createTheme,
  ThemeProvider,
  useColorScheme,
  VisuallyHidden,
  type ColorScheme,
} from '@sauce-ui/react'
import '@sauce-ui/react/base.css'
import '@sauce-ui/react/styles.css'

const brand = createTheme({
  name: 'brand',
  color: { accent: { light: '#7c3aed', dark: '#c4b5fd' }, surface: '#fef3c7' },
})
const rounded = createTheme({ name: 'rounded', radius: { md: '2px' } })

/** Exposes the resolved tokens at this point in the tree for e2e assertions. */
const Probe = ({ id, children }: { id: string; children?: ReactNode }) => (
  <div>
    <p
      data-testid={id}
      style={{
        color: 'var(--sauce-color-accent)',
        backgroundColor: 'var(--sauce-color-surface)',
        borderRadius: 'var(--sauce-radius-md)',
      }}
    >
      {id}
    </p>
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
    <h1>SauceUI playground</h1>
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
