import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthoringTheme } from '../../index.ts'

describe('AuthoringTheme', () => {
  it('wraps its children in the theme’s scope, passing props through', () => {
    render(
      <AuthoringTheme data-testid="theme" className="app">
        <input aria-label="Name" />
      </AuthoringTheme>
    )
    const scope = screen.getByTestId('theme')
    expect(scope).toHaveClass('greese-AuthoringTheme', 'app')
    expect(scope).toContainElement(screen.getByRole('textbox', { name: 'Name' }))
  })
})
