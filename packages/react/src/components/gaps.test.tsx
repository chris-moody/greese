import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../test/axe.ts'
import { functionProps } from '../test/serverProps.ts'
import { Combobox } from './Combobox/Combobox.tsx'
import { DateField } from './DateField/DateField.tsx'
import { dismissDirection, shouldDismiss } from './Dialog/Dialog.tsx'
import { NumberField, parseNumber } from './NumberField/NumberField.tsx'
import { Segment, SegmentedControl } from './SegmentedControl/SegmentedControl.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
} from './Table/Table.tsx'

const countries = [
  { value: 'br', label: 'Brasil' },
  { value: 'ci', label: "Côte d'Ivoire" },
  { value: 'mx', label: 'México' },
  { value: 'nz', label: 'New Zealand' },
  { value: 'no', label: 'Norway', disabled: true },
]

describe('SegmentedControl', () => {
  it('is a named radio group that selects and reports', async () => {
    const onValueChange = vi.fn()
    render(
      <SegmentedControl label="View" defaultValue="list" onValueChange={onValueChange}>
        <Segment value="list">List</Segment>
        <Segment value="grid">Grid</Segment>
      </SegmentedControl>
    )
    expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked()
    await userEvent.click(screen.getByText('Grid'))
    expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked()
    expect(onValueChange).toHaveBeenCalledWith('grid')
  })

  it('requires its parent', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Segment value="x">x</Segment>)).toThrow(
      'inside <SegmentedControl>'
    )
  })
})

describe('DateField', () => {
  it('is a labelled native date input by default, other types on request', () => {
    render(
      <>
        <DateField label="Start" min="2026-01-01" />
        <DateField label="At" type="time" />
      </>
    )
    expect(screen.getByLabelText('Start')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('Start')).toHaveAttribute('min', '2026-01-01')
    expect(screen.getByLabelText('At')).toHaveAttribute('type', 'time')
  })
})

describe('NumberField', () => {
  it('puts back the value in force when a controlled parent declines one', async () => {
    const onValueChange = vi.fn()
    render(
      <>
        <NumberField label="Width" value={4} onValueChange={onValueChange} />
        <button type="button">elsewhere</button>
      </>
    )
    const input = screen.getByRole('spinbutton', {
      name: 'Width',
    }) as HTMLInputElement
    await userEvent.clear(input)
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }))
    expect(onValueChange).toHaveBeenLastCalledWith(null)

    // The parent kept 4, so the field must not be left looking empty: leaving
    // it re-reads the value in force rather than trusting what was typed.
    expect(input.value).toBe('4')
  })

  it.each([
    ['', null],
    [' 42 ', 42],
    ['1,5', 1.5],
    ['-.25', -0.25],
    ['1e3', 1000],
    ['12px', NaN],
    ['--1', NaN],
  ])('parseNumber(%j) → %s', (text, expected) => {
    expect(parseNumber(text)).toBe(expected)
  })

  it('is a spinbutton with a number pad and its value in ARIA', () => {
    render(<NumberField label="Qty" defaultValue={2} min={0} max={10} />)
    const input = screen.getByRole('spinbutton', { name: 'Qty' })
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveAttribute('aria-valuenow', '2')
    expect(input).toHaveAttribute('aria-valuemin', '0')
    expect(input).toHaveAttribute('aria-valuemax', '10')
  })

  it('steps with arrows and Page keys, jumps with Home/End, and clamps', async () => {
    const onValueChange = vi.fn()
    render(
      <NumberField
        label="Qty"
        defaultValue={5}
        min={0}
        max={30}
        onValueChange={onValueChange}
      />
    )
    const input = screen.getByRole<HTMLInputElement>('spinbutton')
    input.focus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(input.value).toBe('7')
    await userEvent.keyboard('{PageUp}{PageUp}{PageUp}')
    expect(input.value).toBe('30')
    await userEvent.keyboard('{Home}')
    expect(input.value).toBe('0')
    await userEvent.keyboard('{ArrowDown}')
    expect(input.value).toBe('0')
    await userEvent.keyboard('{End}')
    expect(onValueChange).toHaveBeenLastCalledWith(30)
  })

  it('snaps decimal steps from min without float noise', async () => {
    render(<NumberField label="Rate" defaultValue={0.1} step={0.1} />)
    const input = screen.getByRole<HTMLInputElement>('spinbutton')
    input.focus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(input.value).toBe('0.3')
  })

  it('commits typed values on blur: clamped, reverted when invalid, null when empty', async () => {
    const onValueChange = vi.fn()
    render(
      <NumberField label="Qty" defaultValue={3} max={10} onValueChange={onValueChange} />
    )
    const input = screen.getByRole<HTMLInputElement>('spinbutton')
    await userEvent.clear(input)
    await userEvent.type(input, '99')
    await userEvent.tab()
    expect(input.value).toBe('10')
    await userEvent.clear(input)
    await userEvent.type(input, 'abc')
    await userEvent.tab()
    expect(input.value).toBe('10')
    await userEvent.clear(input)
    await userEvent.tab()
    expect(input.value).toBe('')
    expect(onValueChange.mock.calls).toEqual([[10], [null]])
  })

  it('has stepper buttons that keep focus in the input and disable at the bounds', async () => {
    render(<NumberField label="Qty" defaultValue={1} min={0} max={2} />)
    const input = screen.getByRole<HTMLInputElement>('spinbutton')
    await userEvent.click(screen.getByRole('button', { name: 'Increase' }))
    expect(input.value).toBe('2')
    expect(input).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Decrease' }))
    await userEvent.click(screen.getByRole('button', { name: 'Decrease' }))
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled()
  })

  it('follows a controlled value', async () => {
    const Controlled = () => {
      const [v, setV] = useState<number | null>(4)
      return (
        <>
          <NumberField label="Qty" value={v} onValueChange={setV} />
          <button onClick={() => setV(9)}>Set 9</button>
        </>
      )
    }
    render(<Controlled />)
    await userEvent.click(screen.getByRole('button', { name: 'Set 9' }))
    expect(screen.getByRole<HTMLInputElement>('spinbutton').value).toBe('9')
  })
})

describe('Table', () => {
  const Example = ({ stacked }: { stacked?: boolean }) => {
    const [sort, setSort] = useState<'ascending' | 'descending'>('ascending')
    return (
      <Table caption="Invoices" stackBelow={stacked ? 'sm' : undefined}>
        <TableHead>
          <TableRow>
            <TableHeaderCell
              sort={sort}
              onSort={() =>
                setSort((s) => (s === 'ascending' ? 'descending' : 'ascending'))
              }
            >
              Number
            </TableHeaderCell>
            <TableHeaderCell align="end">Total</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell label="Number">INV-1</TableCell>
            <TableCell label="Total" align="end">
              $10
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  it('has a footer row group that keeps its role, so it survives stacking', () => {
    render(
      <Table caption="Totals" stackBelow="sm">
        <TableBody>
          <TableRow>
            <TableCell>Rent</TableCell>
          </TableRow>
        </TableBody>
        <TableFoot data-testid="foot">
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFoot>
      </Table>
    )
    expect(screen.getByTestId('foot').tagName).toBe('TFOOT')
    // Stacked, the table's display changes, so its parts say what they are.
    expect(screen.getByTestId('foot')).toHaveAttribute('role', 'rowgroup')
  })

  it('is a Server Component: no context, and no function handed to the DOM', () => {
    const server = [
      Table,
      TableHead,
      TableBody,
      TableFoot,
      TableRow,
      TableHeaderCell,
      TableCell,
    ] as unknown as Parameters<typeof functionProps>[1]
    expect(
      functionProps(
        <Table caption="Plain">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableHeaderCell scope="row">Ada</TableHeaderCell>
              <TableCell>1815</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
        server
      )
    ).toEqual([])
  })

  it('carries explicit roles on every table, stacked or not', () => {
    render(<Example />)
    expect(screen.getByRole('table')).toHaveAttribute('role', 'table')
    expect(screen.getAllByRole('row')[0]).toHaveAttribute('role', 'row')
  })

  it('is a named, keyboard-scrollable table with sortable headers', async () => {
    render(<Example />)
    const region = screen.getByRole('region', { name: 'Invoices' })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('table', { name: 'Invoices' })).toBeInTheDocument()
    const header = screen.getByRole('columnheader', { name: 'Number' })
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    await userEvent.click(screen.getByRole('button', { name: 'Number' }))
    expect(header).toHaveAttribute('aria-sort', 'descending')
    expect(screen.getByRole('columnheader', { name: 'Total' })).not.toHaveAttribute(
      'aria-sort'
    )
    expect(screen.getByRole('cell', { name: '$10' })).toHaveAttribute('data-align', 'end')
  })

  it('keeps explicit table roles and cell labels for the stacked layout', () => {
    render(<Example stacked />)
    expect(screen.getByRole('region')).toHaveClass('greese-Table--stack-below-sm')
    expect(screen.getByRole('table')).toHaveAttribute('role', 'table')
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('role', 'row')
    expect(screen.getByRole('cell', { name: 'INV-1' })).toHaveAttribute(
      'data-label',
      'Number'
    )
  })
})

describe('Combobox', () => {
  const setup = (props: Partial<Parameters<typeof Combobox>[0]> = {}) =>
    render(<Combobox label="Country" name="country" options={countries} {...props} />)

  it('is a labelled combobox that controls a listbox', () => {
    setup()
    const input = screen.getByRole('combobox', { name: 'Country' })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(document.getElementById(input.getAttribute('aria-controls')!)).toHaveAttribute(
      'role',
      'listbox'
    )
  })

  it('filters as you type, ignoring case and accents, and announces the count', async () => {
    setup()
    const input = screen.getByRole('combobox')
    await userEvent.type(input, 'cote')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      "Côte d'Ivoire",
    ])
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('1 result')
    await userEvent.clear(input)
    await userEvent.type(input, 'zzz')
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('moves with arrows (skipping disabled), selects with Enter, submits the value', async () => {
    const onValueChange = vi.fn()
    setup({ onValueChange })
    const input = screen.getByRole<HTMLInputElement>('combobox')
    input.focus()
    await userEvent.keyboard('{ArrowDown}')
    const activeId = () => input.getAttribute('aria-activedescendant')
    expect(document.getElementById(activeId()!)).toHaveTextContent('Brasil')
    await userEvent.keyboard('{ArrowUp}')
    // Wraps to the last enabled option: Norway is disabled.
    expect(document.getElementById(activeId()!)).toHaveTextContent('New Zealand')
    await userEvent.keyboard('{Enter}')
    expect(input.value).toBe('New Zealand')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(onValueChange).toHaveBeenCalledWith('nz')
    expect(
      document.querySelector<HTMLInputElement>('input[type="hidden"][name="country"]')!
        .value
    ).toBe('nz')
  })

  it('selects by click, keeping focus in the input', async () => {
    setup()
    const input = screen.getByRole<HTMLInputElement>('combobox')
    await userEvent.click(screen.getByRole('button', { name: 'Show options' }))
    expect(input).toHaveFocus()
    await userEvent.click(screen.getByRole('option', { name: 'México' }))
    expect(input.value).toBe('México')
    expect(input).toHaveFocus()
  })

  it('Escape closes, then clears; blur reverts text that matches nothing', async () => {
    setup({ defaultValue: 'br' })
    const input = screen.getByRole<HTMLInputElement>('combobox')
    expect(input.value).toBe('Brasil')
    await userEvent.clear(input)
    await userEvent.type(input, 'new zeal')
    await userEvent.keyboard('{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input.value).toBe('new zeal')
    await userEvent.tab()
    expect(input.value).toBe('Brasil')
    input.focus()
    await userEvent.keyboard('{Escape}')
    expect(input.value).toBe('')
  })

  it('accepts free text with allowCustomValue, and exact typed matches select', async () => {
    const onValueChange = vi.fn()
    setup({ allowCustomValue: true, onValueChange })
    const input = screen.getByRole<HTMLInputElement>('combobox')
    await userEvent.type(input, 'Atlantis')
    await userEvent.tab()
    expect(onValueChange).toHaveBeenLastCalledWith('Atlantis')
    await userEvent.clear(input)
    await userEvent.type(input, 'mexico')
    await userEvent.tab()
    expect(onValueChange).toHaveBeenLastCalledWith('mx')
    expect(input.value).toBe('México')
  })

  it('keeps free text on Enter when no option matches, and closes', async () => {
    const onValueChange = vi.fn()
    setup({ allowCustomValue: true, onValueChange })
    const input = screen.getByRole<HTMLInputElement>('combobox')
    await userEvent.type(input, 'Atlantis{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith('Atlantis')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('Drawer swipe-to-dismiss', () => {
  it('maps each edge (and RTL) to the dismiss direction', () => {
    expect(dismissDirection('bottom', false)).toEqual({ axis: 'y', sign: 1 })
    expect(dismissDirection('top', false)).toEqual({ axis: 'y', sign: -1 })
    expect(dismissDirection('end', false)).toEqual({ axis: 'x', sign: 1 })
    expect(dismissDirection('end', true)).toEqual({ axis: 'x', sign: -1 })
    expect(dismissDirection('start', true)).toEqual({ axis: 'x', sign: 1 })
    expect(dismissDirection('', false)).toBeNull()
  })

  it('dismisses past 30% or on a quick flick, not on a nudge', () => {
    expect(shouldDismiss(130, 400, 1000)).toBe(true)
    expect(shouldDismiss(60, 400, 80)).toBe(true)
    expect(shouldDismiss(60, 400, 600)).toBe(false)
    expect(shouldDismiss(15, 400, 10)).toBe(false)
  })
})

describe('Phase 7 accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <main>
        <SegmentedControl label="View" defaultValue="a">
          <Segment value="a">A</Segment>
          <Segment value="b">B</Segment>
        </SegmentedControl>
        <DateField label="Date" />
        <NumberField label="Qty" defaultValue={1} />
        <Combobox label="Country" options={countries} />
        <Table caption="Data" stackBelow="sm">
          <TableHead>
            <TableRow>
              <TableHeaderCell sort="ascending" onSort={() => {}}>
                Name
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell label="Name">Ada</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </main>
    )
    await expectNoAxeViolations(container)
  })

  it('submits through native forms', async () => {
    const onSubmit = vi.fn()
    render(
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(Object.fromEntries(new FormData(e.currentTarget)))
        }}
      >
        <SegmentedControl label="View" name="view" defaultValue="grid">
          <Segment value="list">List</Segment>
          <Segment value="grid">Grid</Segment>
        </SegmentedControl>
        <NumberField label="Qty" name="qty" defaultValue={3} />
        <DateField label="Due" name="due" defaultValue="2026-10-18" />
        <Combobox label="Country" name="country" options={countries} defaultValue="mx" />
        <button type="submit">Go</button>
      </form>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onSubmit).toHaveBeenCalledWith({
      view: 'grid',
      qty: '3',
      due: '2026-10-18',
      country: 'mx',
    })
  })
})
