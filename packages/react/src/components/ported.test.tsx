import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../test/axe.ts'
import { ActionSelect } from './ActionSelect/ActionSelect.tsx'
import { AutoLayout, AutoLayoutItem, resolveMaxSize } from './AutoLayout/AutoLayout.tsx'
import { Break } from './Break/Break.tsx'
import {
  ColorPicker,
  formatHex,
  hsvToRgb,
  parseHex,
  rgbToHsv,
} from './ColorPicker/ColorPicker.tsx'
import { Field } from './Field/Field.tsx'
import {
  applyMask,
  isMaskComplete,
  MaskedInput,
  unmask,
} from './MaskedInput/MaskedInput.tsx'

const classes = (el: Element | null) => [...(el?.classList ?? [])]

describe('Break', () => {
  it('breaks always without a range', () => {
    const { container } = render(
      <p>
        a<Break />b
      </p>
    )
    expect(container.querySelectorAll('br')).toHaveLength(1)
    expect(container.textContent).toBe('ab')
  })

  it('shows the break in range and a non-breaking space outside it', () => {
    const { container } = render(
      <p>
        Fast,
        <Break above="md" />
        everywhere
      </p>
    )
    const br = container.querySelector('br')
    expect(classes(br)).toEqual(['greese-Visibility--hide-below-md'])
    const fallback = container.querySelector('span')
    expect(fallback?.textContent).toBe('\u00A0')
    expect(classes(fallback)).toEqual(['greese-Visibility--hide-from-md'])
  })

  it('inverts a range for the fallback', () => {
    const { container } = render(
      <p>
        a<Break above="sm" below="lg" fallback=" · " />b
      </p>
    )
    expect(classes(container.querySelector('br'))).toEqual([
      'greese-Visibility--hide-below-sm',
      'greese-Visibility--hide-from-lg',
    ])
    const fallback = container.querySelector('span')
    expect(fallback?.textContent).toBe(' · ')
    expect(classes(fallback)).toEqual(['greese-Visibility--hide-sm-to-lg'])
  })

  it('renders no fallback when given null, or any node', () => {
    const { container, rerender } = render(
      <p>
        a<Break below="md" fallback={null} />b
      </p>
    )
    expect(container.querySelector('span')).toBeNull()
    rerender(
      <p>
        a<Break below="md" fallback={<em>or</em>} />b
      </p>
    )
    expect(container.querySelector('span > em')?.textContent).toBe('or')
  })
})

describe('mask helpers', () => {
  it('formats, unmasks and checks completeness', () => {
    expect(applyMask('5551234', '(999) 999-9999')).toBe('(555) 123-4___')
    expect(applyMask('5a5', '999')).toBe('55_')
    expect(unmask('(555) 123-4___', '(999) 999-9999')).toBe('5551234')
    // A literal that is also valid input is never read back as typing.
    expect(unmask('+1 (2__)', '+1 (999)')).toBe('2')
    expect(isMaskComplete('5551234', '(999) 999-9999')).toBe(false)
    expect(isMaskComplete('5551234567', '(999) 999-9999')).toBe(true)
  })
})

describe('MaskedInput', () => {
  it('formats as you type and reports the raw value', async () => {
    const onValueChange = vi.fn()
    render(
      <Field label="Phone">
        <MaskedInput mask="(999) 999-9999" onValueChange={onValueChange} />
      </Field>
    )
    const input = screen.getByLabelText('Phone') as HTMLInputElement
    expect(input).toHaveAttribute('inputmode', 'numeric')
    await userEvent.type(input, '555x1234')
    expect(input.value).toBe('(555) 123-4___')
    expect(onValueChange).toHaveBeenLastCalledWith('5551234', '(555) 123-4___')
    // The caret sits after the last digit, past nothing it shouldn't skip.
    expect(input.selectionStart).toBe(11)
  })

  it('removes the digit before a literal on Backspace', async () => {
    render(<MaskedInput aria-label="Phone" mask="(999) 999-9999" defaultValue="5551" />)
    const input = screen.getByLabelText('Phone') as HTMLInputElement
    input.focus()
    input.setSelectionRange(6, 6) // just after "(555) "
    await userEvent.keyboard('{Backspace}')
    expect(input.value).toBe('(551) ___-____')
  })

  it('keeps literal digits out of the value', async () => {
    const onValueChange = vi.fn()
    render(<MaskedInput aria-label="Tel" mask="+1 999" onValueChange={onValueChange} />)
    await userEvent.type(screen.getByLabelText('Tel'), '1')
    expect(onValueChange).toHaveBeenLastCalledWith('1', '+1 1__')
  })

  it('clears to empty so the placeholder shows', async () => {
    render(
      <MaskedInput aria-label="Code" mask="AA-99" defaultValue="A" placeholder="AB-12" />
    )
    const input = screen.getByLabelText('Code') as HTMLInputElement
    expect(input).not.toHaveAttribute('inputmode')
    await userEvent.clear(input)
    expect(input.value).toBe('')
  })
})

describe('colour math', () => {
  it('parses and formats hex', () => {
    expect(parseHex('#f80')).toEqual({ r: 255, g: 136, b: 0, a: 1 })
    expect(parseHex('3b82f680')).toMatchObject({ r: 59, g: 130, b: 246 })
    expect(parseHex('nope')).toBeUndefined()
    expect(formatHex({ r: 255, g: 136, b: 0, a: 1 })).toBe('#ff8800')
    expect(formatHex({ r: 0, g: 0, b: 0, a: 0.5 })).toBe('#00000080')
  })

  it('round-trips through HSV and keeps the hue of a grey', () => {
    const rgb = parseHex('#3b82f6')!
    expect(formatHex(hsvToRgb(rgbToHsv(rgb)))).toBe('#3b82f6')
    expect(rgbToHsv({ r: 128, g: 128, b: 128, a: 1 }, 200).h).toBe(200)
  })
})

describe('ColorPicker', () => {
  it('is named, accessible and moves by keyboard', async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <ColorPicker label="Brand" defaultValue="#ff0000" onValueChange={onValueChange} />
    )
    expect(screen.getByRole('group', { name: 'Brand' })).toBeInTheDocument()
    const area = screen.getByRole('slider', { name: 'Saturation and brightness' })
    expect(area).toHaveAttribute('aria-valuetext', 'Saturation 100%, brightness 100%')
    area.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(onValueChange).toHaveBeenLastCalledWith(
      '#fc0000',
      expect.objectContaining({ a: 1 })
    )
    await userEvent.keyboard('{Home}')
    expect(onValueChange).toHaveBeenLastCalledWith('#fcfcfc', expect.anything())
    await expectNoAxeViolations(container)
  })

  it('takes hue, hex and swatches', async () => {
    const onValueChange = vi.fn()
    render(
      <ColorPicker
        defaultValue="#ff0000"
        swatches={['#00ff00']}
        onValueChange={onValueChange}
      />
    )
    fireEvent.change(screen.getByRole('slider', { name: 'Hue' }), {
      target: { value: '240' },
    })
    expect(onValueChange).toHaveBeenLastCalledWith('#0000ff', expect.anything())

    const hex = screen.getByLabelText('Hex colour') as HTMLInputElement
    await userEvent.clear(hex)
    await userEvent.type(hex, '123abc')
    expect(onValueChange).toHaveBeenLastCalledWith('#123abc', expect.anything())

    await userEvent.click(screen.getByRole('button', { name: '#00ff00' }))
    expect(onValueChange).toHaveBeenLastCalledWith('#00ff00', expect.anything())
    expect(screen.getByRole('button', { name: '#00ff00' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('adds an opacity channel with alpha', () => {
    const onValueChange = vi.fn()
    render(<ColorPicker alpha defaultValue="#000000" onValueChange={onValueChange} />)
    fireEvent.change(screen.getByRole('slider', { name: 'Opacity' }), {
      target: { value: '50' },
    })
    expect(onValueChange).toHaveBeenLastCalledWith(
      '#00000080',
      expect.objectContaining({ a: 0.5 })
    )
  })

  it('follows a controlled value', () => {
    const Controlled = () => {
      const [value, setValue] = useState('#ff0000')
      return (
        <>
          <ColorPicker value={value} onValueChange={setValue} />
          <button onClick={() => setValue('#0000ff')}>blue</button>
        </>
      )
    }
    render(<Controlled />)
    fireEvent.click(screen.getByText('blue'))
    expect(screen.getByRole('slider', { name: 'Hue' })).toHaveValue('240')
  })
})

describe('AutoLayout', () => {
  it('defaults maxSize to size per breakpoint', () => {
    expect(resolveMaxSize(4, undefined)).toEqual({ xs: 4 })
    expect(resolveMaxSize({ xs: 12, md: 4 }, { md: 6 })).toEqual({ xs: 12, md: 6 })
    expect(resolveMaxSize(undefined, 6)).toBe(6)
  })

  it('maps sizes to per-breakpoint variables', () => {
    render(
      <AutoLayout columns={6} gap={{ xs: 2, md: '20px' }} data-testid="row">
        <AutoLayoutItem size={{ xs: 6, md: 2 }} maxSize={{ md: 3 }} data-testid="item" />
      </AutoLayout>
    )
    const row = screen.getByTestId('row')
    expect(classes(row)).toEqual([
      'greese-Box',
      'greese-AutoLayout',
      'greese-AutoLayout--xs-gap-2',
      'greese-AutoLayout--md-gap',
    ])
    expect(row.style.getPropertyValue('--greese-autolayout-columns')).toBe('6')
    expect(row.style.getPropertyValue('--greese-autolayout-gap-md')).toBe('20px')
    const item = screen.getByTestId('item')
    expect(item.style.getPropertyValue('--greese-autolayoutitem-size-md')).toBe('2')
    expect(item.style.getPropertyValue('--greese-autolayoutitem-max-xs')).toBe('6')
    expect(item.style.getPropertyValue('--greese-autolayoutitem-max-md')).toBe('3')
  })
})

describe('ActionSelect', () => {
  it('acts, chooses and groups options', async () => {
    const onAction = vi.fn()
    const onValueChange = vi.fn()
    const { container } = render(
      <ActionSelect
        icon={<svg />}
        actionLabel="New project"
        onAction={onAction}
        selectLabel="Project"
        defaultValue="a"
        onValueChange={onValueChange}
        options={[
          { value: 'a', label: 'Alpha', group: 'Recent' },
          { value: 'b', label: 'Beta', group: 'Recent' },
          { value: 'c', label: 'Gamma' },
        ]}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'New project' }))
    expect(onAction).toHaveBeenCalledOnce()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Project' }), 'c')
    expect(onValueChange).toHaveBeenCalledWith('c')
    expect(container.querySelectorAll('optgroup')).toHaveLength(1)
    expect(container.querySelector('optgroup')?.children).toHaveLength(2)
    await expectNoAxeViolations(container)
  })
})
