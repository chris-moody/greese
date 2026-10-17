import { describe, expect, it } from 'vitest'
import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { expectNoAxeViolations } from '../../test/axe.ts'
import { VisuallyHidden } from './VisuallyHidden.tsx'

describe('VisuallyHidden', () => {
  it('keeps content in the accessibility tree', () => {
    render(
      <button>
        <VisuallyHidden>Close dialog</VisuallyHidden>
      </button>
    )
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument()
  })

  it('merges className and forwards ref', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<VisuallyHidden ref={ref} className="extra" />)
    expect(ref.current).toHaveClass('sauce-VisuallyHidden', 'extra')
  })
})

describe('VisuallyHidden accessibility', () => {
  it('has no axe violations as an icon-button label', async () => {
    const { container } = render(
      <button>
        <span aria-hidden="true">×</span>
        <VisuallyHidden>Close</VisuallyHidden>
      </button>
    )
    await expectNoAxeViolations(container)
  })
})
