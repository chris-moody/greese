import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Heading } from './Heading/Heading.tsx'
import { Text } from './Text/Text.tsx'
import { expectNoAxeViolations } from '../test/axe.ts'

describe('type variants', () => {
  it('Text takes a variant, which owns size and weight', () => {
    render(
      <Text variant="p2" weight="bold">
        Body
      </Text>
    )
    const el = screen.getByText('Body')
    expect(el).toHaveClass('greese-Text', 'greese-Type--p2')
    expect(el).not.toHaveClass('greese-Text--bold')
  })

  it('Text without a variant takes its weight and nothing for size', () => {
    render(<Text weight="bold">Plain</Text>)
    const el = screen.getByText('Plain')
    expect(el).toHaveClass('greese-Text--bold')
    expect(el.className).not.toContain('greese-Type')
  })

  it('Heading keeps its level for the element and takes the look from a variant', async () => {
    const { container } = render(
      <Heading level={2} variant="h4">
        Section
      </Heading>
    )
    const el = screen.getByRole('heading', { level: 2, name: 'Section' })
    expect(el).toHaveClass('greese-Heading', 'greese-Type--h4')
    await expectNoAxeViolations(container)
  })

  it('Heading without a variant takes the style of its level', () => {
    render(<Heading level={3}>Plain</Heading>)
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('greese-Type--h3')
  })
})
