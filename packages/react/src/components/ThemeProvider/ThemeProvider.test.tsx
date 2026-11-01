import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createTheme } from '@greese/ui'
import { expectNoAxeViolations } from '../../test/axe.ts'
import { ThemeProvider, useThemeScope } from './ThemeProvider.tsx'

const brand = createTheme({ name: 'brand', color: { accent: '#7c3aed' } })
const other = createTheme({ name: 'other', radius: { md: '2px' } })

const Scope = () => {
  const { theme, scheme } = useThemeScope()
  return <output>{`${theme ?? '-'}/${scheme ?? '-'}`}</output>
}

describe('ThemeProvider', () => {
  it('stamps the theme and scheme on a layout-neutral wrapper', () => {
    render(
      <ThemeProvider theme={brand} scheme="dark" data-testid="root" className="mine">
        <Scope />
      </ThemeProvider>
    )
    const root = screen.getByTestId('root')
    expect(root).toHaveClass('greese-ThemeProvider', 'mine')
    expect(root).toHaveAttribute('data-greese-theme', 'brand')
    expect(root).toHaveAttribute('data-greese-scheme', 'dark')
    expect(screen.getByRole('status')).toHaveTextContent('brand/dark')
  })

  it('reduces motion for its subtree with motion="reduce"', () => {
    render(
      <>
        <ThemeProvider motion="reduce" data-testid="reduced" />
        <ThemeProvider motion="system" data-testid="system" />
      </>
    )
    expect(screen.getByTestId('reduced')).toHaveAttribute('data-greese-motion', 'reduce')
    expect(screen.getByTestId('system')).not.toHaveAttribute('data-greese-motion')
  })

  it('hoists the theme CSS into <head> once, however many providers use it', () => {
    render(
      <>
        <ThemeProvider theme={brand} />
        <ThemeProvider theme={brand} />
      </>
    )
    const styles = document.head.querySelectorAll('style[data-href="greese-theme-brand"]')
    expect(styles).toHaveLength(1)
    expect(styles[0]!.textContent).toBe(brand.css)
  })

  it('scopes a theme by name, leaving its CSS to you', () => {
    render(
      <ThemeProvider theme="compiled" data-testid="named">
        <ThemeProvider scheme="dark" data-testid="dark" />
      </ThemeProvider>
    )
    expect(screen.getByTestId('named')).toHaveAttribute('data-greese-theme', 'compiled')
    expect(screen.getByTestId('dark')).toHaveAttribute('data-greese-theme', 'compiled')
    expect(
      document.head.querySelector('style[data-href="greese-theme-compiled"]')
    ).toBeNull()
  })

  it('makes nested providers inherit what they do not set', () => {
    render(
      <ThemeProvider theme={brand} data-testid="outer">
        <ThemeProvider scheme="dark" data-testid="dark">
          <ThemeProvider theme={other} data-testid="inner">
            <Scope />
          </ThemeProvider>
        </ThemeProvider>
      </ThemeProvider>
    )
    expect(screen.getByTestId('outer')).not.toHaveAttribute('data-greese-scheme')
    // A scheme-only provider keeps the theme, so theme rules still apply there.
    expect(screen.getByTestId('dark')).toHaveAttribute('data-greese-theme', 'brand')
    // A nested theme keeps the forced scheme.
    expect(screen.getByTestId('inner')).toHaveAttribute('data-greese-scheme', 'dark')
    expect(screen.getByRole('status')).toHaveTextContent('other/dark')
  })

  it('scopes your own element with asChild, without the wrapper class', () => {
    const ref = createRef<HTMLElement>()
    render(
      <ThemeProvider asChild theme={brand} scheme="light" ref={ref}>
        <main className="page">content</main>
      </ThemeProvider>
    )
    const main = screen.getByRole('main')
    expect(ref.current).toBe(main)
    expect(main).toHaveClass('page')
    expect(main).not.toHaveClass('greese-ThemeProvider')
    expect(main).toHaveAttribute('data-greese-theme', 'brand')
  })

  it('renders no attributes or style when given nothing', () => {
    render(<ThemeProvider data-testid="bare" />)
    const bare = screen.getByTestId('bare')
    expect(bare).not.toHaveAttribute('data-greese-theme')
    expect(bare).not.toHaveAttribute('data-greese-scheme')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ThemeProvider theme={brand}>
        <button>ok</button>
      </ThemeProvider>
    )
    await expectNoAxeViolations(container)
  })
})
