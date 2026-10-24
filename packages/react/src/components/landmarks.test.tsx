import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../test/axe.ts'
import { Footer, FooterSection } from './Footer/Footer.tsx'
import { Header } from './Header/Header.tsx'

describe('Header', () => {
  it('is the banner, with brand, navigation and actions in its row', async () => {
    const { container } = render(
      <Header
        brand={<a href="/">Acme</a>}
        actions={<button type="button">Sign in</button>}
      >
        <nav aria-label="Main">
          <a href="/docs">Docs</a>
        </nav>
      </Header>
    )
    const header = screen.getByRole('banner')
    expect(header).toHaveClass(
      'greese-Header',
      'greese-Header--sticky',
      'greese-Header--size-lg'
    )
    expect(header.querySelector('.greese-Header-brand')).toHaveTextContent('Acme')
    expect(header.querySelector('.greese-Header-nav')).toContainElement(
      screen.getByRole('navigation', { name: 'Main' })
    )
    expect(header.querySelector('.greese-Header-actions')).toHaveTextContent('Sign in')
    await expectNoAxeViolations(container)
  })

  it('floats, or scrolls away, as asked, and leaves out the slots it isn’t given', () => {
    render(<Header floating sticky={false} size="full" />)
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('greese-Header--floating', 'greese-Header--size-full')
    expect(header).not.toHaveClass('greese-Header--sticky')
    expect(header.querySelector('.greese-Header-brand')).toBeNull()
    expect(header.querySelector('.greese-Header-actions')).toBeNull()
  })

  it('renders on the server', () => {
    expect(renderToString(<Header brand="Acme" />)).toContain('greese-Header-brand')
  })
})

describe('Footer', () => {
  it('leaves out parts that render nothing, conditional children included', () => {
    const show = false
    const { container } = render(
      <Footer brand={null} legal="© 2026 Acme">
        {show && <FooterSection title="Product">x</FooterSection>}
        {null}
      </Footer>
    )
    expect(container.querySelector('.greese-Footer-main')).toBeNull()
    expect(container.querySelector('.greese-Footer-legal')).toHaveTextContent(
      '© 2026 Acme'
    )
    render(
      <FooterSection title="Company">
        <a href="/about">About</a>
        {false}
        {true}
        {null}
      </FooterSection>
    )
    expect(
      screen.getByRole('navigation', { name: 'Company' }).querySelectorAll('li')
    ).toHaveLength(1)
  })

  it('is the contentinfo, with named sections of listed links and a legal row', async () => {
    const { container } = render(
      <Footer brand="Acme" legal="© 2026 Acme">
        <FooterSection title="Product">
          <a href="/pricing">Pricing</a>
          {null}
          <a href="/changelog">Changelog</a>
        </FooterSection>
        <FooterSection title={<span>Company</span>} label="Company">
          <a href="/about">About</a>
        </FooterSection>
      </Footer>
    )
    expect(screen.getByRole('contentinfo')).toHaveClass('greese-Footer')
    const product = screen.getByRole('navigation', { name: 'Product' })
    expect(product.querySelectorAll('li')).toHaveLength(2)
    expect(screen.getByRole('navigation', { name: 'Company' })).toBeInTheDocument()
    expect(container.querySelector('.greese-Footer-legal')).toHaveTextContent(
      '© 2026 Acme'
    )
    await expectNoAxeViolations(container)
  })

  it('leaves out the parts it isn’t given', () => {
    const { container } = render(<Footer legal="©" />)
    expect(container.querySelector('.greese-Footer-main')).toBeNull()
  })
})
