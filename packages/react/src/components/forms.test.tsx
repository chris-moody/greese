import { createRef, useState, type FormEvent } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../test/axe.ts'
import { functionProps } from '../test/serverProps.ts'
import { Button } from './Button/Button.tsx'
import { Slot, Slottable } from './Slot/Slot.tsx'
import { ButtonGroup } from './ButtonGroup/ButtonGroup.tsx'
import { Checkbox, CheckboxGroup } from './Checkbox/Checkbox.tsx'
import { EditableField } from './EditableField/EditableField.tsx'
import { NumberField } from './NumberField/NumberField.tsx'
import { NumberStepper } from './NumberStepper/NumberStepper.tsx'
import {
  inferEditableFieldType,
  resolveDecimals,
  roundTo,
  wrapDegrees,
} from './EditableField/fieldValues.ts'
import { Field } from './Field/Field.tsx'
import { FileInput, fileSummary } from './FileInput/FileInput.tsx'
import { IconButton } from './IconButton/IconButton.tsx'
import { Input } from './Input/Input.tsx'
import { Radio, RadioGroup } from './Radio/Radio.tsx'
import { Select } from './Select/Select.tsx'
import { Slider } from './Slider/Slider.tsx'
import { Switch } from './Switch/Switch.tsx'
import { Textarea } from './Textarea/Textarea.tsx'
import { TextField } from './TextField/TextField.tsx'
import { ToggleButton } from './ToggleButton/ToggleButton.tsx'

const Icon = () => <svg data-testid="icon" />

describe('Button', () => {
  it('defaults to type="button" and activates from the keyboard', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass(
      'greese-Button--solid',
      'greese-Button--primary',
      'greese-Button--size-md'
    )
    await userEvent.tab()
    expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('hands no function to the DOM, so a Server Component can render it', () => {
    const server = [Button, Slot, Slottable] as unknown as Parameters<
      typeof functionProps
    >[1]
    expect(functionProps(<Button type="submit">Save</Button>, server)).toEqual([])
    expect(functionProps(<Button loading>Save</Button>, server)).toEqual([])
    expect(
      functionProps(
        <Button asChild disabled>
          <a href="/docs">Docs</a>
        </Button>,
        server
      )
    ).toEqual([])
  })

  it('does not submit its form while loading, with no script of its own', async () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault())
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Save
        </Button>
      </form>
    )
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('type', 'button')
    await userEvent.click(button)
    expect(onSubmit).not.toHaveBeenCalled()
    rerender(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>
    )
    await userEvent.click(button)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('renders a link with href, as a server-safe <a> with no type', async () => {
    const { container } = render(
      <Button href="/docs" startIcon={<Icon />} variant="soft">
        Docs
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/docs')
    expect(link).toHaveClass('greese-Button', 'greese-Button--soft')
    expect(link).not.toHaveAttribute('type')
    expect(link).not.toHaveAttribute('disabled')
    expect(functionProps(<Button href="/docs">Docs</Button>, [Button] as never)).toEqual(
      []
    )
    await expectNoAxeViolations(container)
  })

  it('takes a disabled href link out of the tab order', () => {
    render(
      <Button href="/docs" disabled>
        Docs
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link).toHaveAttribute('tabindex', '-1')
    expect(link).toHaveAttribute('aria-disabled', 'true')
  })

  it('takes href or onClick, never both (types)', () => {
    const go = () => {}
    // @ts-expect-error a link has no onClick
    void (<Button href="/docs" onClick={go} />)
    // @ts-expect-error a link renders its own <a>, not your element
    void (<Button href="/docs" asChild />)
    const iconLink = { label: 'Docs', href: '/docs', children: 'x' }
    // @ts-expect-error an icon link has no onClick either
    void (<IconButton {...iconLink} onClick={go} />)
    void (<IconButton {...iconLink} />)
    expect(true).toBe(true)
  })

  it('takes a disabled asChild link out of the tab order', () => {
    render(
      <Button asChild disabled>
        <a href="/docs">Docs</a>
      </Button>
    )
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('tabindex', '-1')
  })

  it('stays focusable but inert while loading', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).not.toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(button).toHaveFocus()
  })

  it('renders the text variant, with the same markup as the others', () => {
    render(<Button variant="text">Learn more</Button>)
    expect(screen.getByRole('button', { name: 'Learn more' })).toHaveClass(
      'greese-Button',
      'greese-Button--text',
      'greese-Button--primary'
    )
  })

  it('wraps icons as decorative and keeps them with asChild', () => {
    render(
      <Button asChild startIcon={<Icon />} variant="ghost">
        <a href="/docs">Docs</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link).toHaveClass('greese-Button', 'greese-Button--ghost')
    expect(link).not.toHaveAttribute('type')
    expect(link.querySelector('.greese-Button-icon')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(link).toContainElement(screen.getByTestId('icon'))
  })

  it('marks a disabled asChild link with aria-disabled and swallows clicks', async () => {
    const onClick = vi.fn()
    render(
      <Button asChild disabled onClick={onClick}>
        <a href="#x">Go</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Go' })
    expect(link).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(link)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('resolves responsive fullWidth to classes', () => {
    render(<Button fullWidth={{ xs: true, md: false }}>Wide</Button>)
    expect(screen.getByRole('button')).toHaveClass(
      'greese-Button--xs-width-full',
      'greese-Button--md-width-auto'
    )
  })
})

describe('IconButton, ToggleButton, ButtonGroup', () => {
  it('names an icon-only button from its required label', () => {
    render(
      <IconButton label="Close dialog">
        <Icon />
      </IconButton>
    )
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveClass(
      'greese-IconButton',
      'greese-Button--ghost',
      'greese-Button--neutral'
    )
  })

  it('renders an icon-only link with href, named from its label', () => {
    render(
      <IconButton label="GitHub" href="https://github.com" variant="soft">
        <Icon />
      </IconButton>
    )
    const link = screen.getByRole('link', { name: 'GitHub' })
    expect(link).toHaveAttribute('href', 'https://github.com')
    expect(link).toHaveClass('greese-IconButton', 'greese-Button--soft')
    expect(link.querySelector('.greese-Button-icon')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })

  it('toggles aria-pressed, uncontrolled and controlled', async () => {
    const onPressedChange = vi.fn()
    render(<ToggleButton onPressedChange={onPressedChange}>Bold</ToggleButton>)
    const bold = screen.getByRole('button', { name: 'Bold' })
    expect(bold).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(bold)
    expect(bold).toHaveAttribute('aria-pressed', 'true')
    expect(onPressedChange).toHaveBeenLastCalledWith(true)

    render(<ToggleButton pressed>Italic</ToggleButton>)
    const italic = screen.getByRole('button', { name: 'Italic' })
    await userEvent.click(italic)
    expect(italic).toHaveAttribute('aria-pressed', 'true')
  })

  it('groups buttons with a name', () => {
    render(
      <ButtonGroup aria-label="Formatting" attached>
        <Button>B</Button>
      </ButtonGroup>
    )
    expect(screen.getByRole('group', { name: 'Formatting' })).toHaveClass(
      'greese-ButtonGroup--attached'
    )
  })
})

describe('Field and text controls', () => {
  it('labels, describes and validates its control', () => {
    render(
      <Field label="Email" description="Work address" error="Required" required>
        <Input type="email" />
      </Field>
    )
    const input = screen.getByLabelText(/Email/)
    expect(input).toHaveAccessibleDescription('Work address Required')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toBeRequired()
    expect(input.closest('.greese-Input')).toHaveAttribute('data-invalid', 'true')
  })

  it('omits the error from the description until invalid, and disables the control', () => {
    render(
      <Field label="Name" description="As on your ID" disabled>
        <Input />
      </Field>
    )
    const input = screen.getByLabelText('Name')
    expect(input).toHaveAccessibleDescription('As on your ID')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).toBeDisabled()
  })

  it('TextField is Field + Input, ref on the native input', () => {
    const ref = createRef<HTMLInputElement>()
    render(<TextField label="City" name="city" ref={ref} error="Unknown city" />)
    expect(ref.current).toBe(screen.getByLabelText('City'))
    expect(ref.current).toHaveAccessibleDescription('Unknown city')
  })

  it('focuses the input when its frame or adornment is clicked', async () => {
    render(<Input aria-label="Price" startAdornment="$" />)
    await userEvent.click(screen.getByText('$'))
    expect(screen.getByLabelText('Price')).toHaveFocus()
  })

  it('Textarea exposes rows to the autosize CSS, on its frame', () => {
    render(<Textarea aria-label="Bio" rows={4} maxRows={10} className="mine" invalid />)
    const textarea = screen.getByLabelText('Bio')
    const frame = textarea.parentElement!
    expect(textarea).toHaveClass('greese-Textarea-control')
    expect(textarea).toHaveAttribute('rows', '4')
    expect(frame).toHaveClass('greese-Textarea', 'greese-Textarea--autosize', 'mine')
    expect(frame).toHaveAttribute('data-invalid')
    expect(frame.style.getPropertyValue('--greese-textarea-rows')).toBe('4')
    expect(frame.style.getPropertyValue('--greese-textarea-max-rows')).toBe('10')
  })

  it('Select starts on its placeholder, which cannot be chosen', () => {
    render(
      <Select aria-label="Country" placeholder="Choose…">
        <option value="nz">New Zealand</option>
      </Select>
    )
    const select = screen.getByLabelText<HTMLSelectElement>('Country')
    expect(select.value).toBe('')
    expect(screen.getByText('Choose…')).toBeDisabled()
  })
})

describe('input width', () => {
  it('has no width of its own without htmlSize', () => {
    render(<Input aria-label="Name" />)
    const input = screen.getByLabelText('Name')
    // No `size` attribute means no 20-character preferred width to force on
    // whatever the field sits in.
    expect(input).not.toHaveAttribute('size')
    expect(input.closest('.greese-Input')).not.toHaveClass('greese-Input--measured')
  })

  it('htmlSize sets the native size and marks the frame measured', () => {
    render(<Input aria-label="Frame" htmlSize={4} />)
    const input = screen.getByLabelText('Frame')
    expect(input).toHaveAttribute('size', '4')
    expect(input.closest('.greese-Input')).toHaveClass('greese-Input--measured')
  })

  it('does not collide with the control size scale', () => {
    render(<Input aria-label="Both" size="lg" htmlSize={2} />)
    const input = screen.getByLabelText('Both')
    const frame = input.closest('.greese-Input')
    expect(input).toHaveAttribute('size', '2')
    expect(frame).toHaveClass('greese-Input--size-lg', 'greese-Input--measured')
  })

  it('reaches the input through TextField and NumberField', () => {
    render(
      <>
        <TextField label="Code" htmlSize={6} />
        <NumberField label="Count" htmlSize={3} value={1} onValueChange={() => {}} />
      </>
    )
    expect(screen.getByLabelText('Code')).toHaveAttribute('size', '6')
    expect(screen.getByLabelText('Count')).toHaveAttribute('size', '3')
  })

  it('reaches an EditableField text row', () => {
    render(
      <EditableField
        label="Label"
        type="text"
        value="x"
        onValueChange={() => {}}
        htmlSize={5}
      />
    )
    expect(screen.getByLabelText('Label')).toHaveAttribute('size', '5')
  })
})

describe('Checkbox, Switch, Radio', () => {
  it('Checkbox toggles from its label and from Space', async () => {
    const onCheckedChange = vi.fn()
    render(
      <Checkbox
        label="Accept terms"
        description="Required"
        onCheckedChange={onCheckedChange}
      />
    )
    // The description is announced as a description, not folded into the name.
    const box = screen.getByRole('checkbox', { name: 'Accept terms' })
    expect(box).toHaveAccessibleDescription('Required')
    await userEvent.click(screen.getByText('Accept terms'))
    expect(box).toBeChecked()
    box.focus()
    await userEvent.keyboard(' ')
    expect(box).not.toBeChecked()
    expect(onCheckedChange.mock.calls).toEqual([[true], [false]])
  })

  it('Checkbox reflects indeterminate as the DOM property', () => {
    const { rerender } = render(<Checkbox aria-label="All" indeterminate />)
    const box = screen.getByRole<HTMLInputElement>('checkbox')
    expect(box.indeterminate).toBe(true)
    rerender(<Checkbox aria-label="All" indeterminate={false} />)
    expect(box.indeterminate).toBe(false)
  })

  it('CheckboxGroup tracks values under a named group', async () => {
    const onValueChange = vi.fn()
    render(
      <CheckboxGroup
        label="Notify me"
        name="notify"
        defaultValue={['email']}
        onValueChange={onValueChange}
      >
        <Checkbox value="email" label="Email" />
        <Checkbox value="sms" label="SMS" />
      </CheckboxGroup>
    )
    expect(screen.getByRole('group', { name: 'Notify me' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Email' })).toBeChecked()
    await userEvent.click(screen.getByRole('checkbox', { name: 'SMS' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['email', 'sms'])
    await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['sms'])
  })

  it('Switch is a checkbox announced as a switch', async () => {
    render(<Switch label="Wi-Fi" />)
    const toggle = screen.getByRole('switch', { name: 'Wi-Fi' })
    await userEvent.click(toggle)
    expect(toggle).toBeChecked()
  })

  it('RadioGroup shares a name, selects one value and reports it', async () => {
    const onValueChange = vi.fn()
    render(
      <RadioGroup
        label="Plan"
        defaultValue="free"
        onValueChange={onValueChange}
        error="Pick one"
      >
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
      </RadioGroup>
    )
    const group = screen.getByRole('radiogroup', { name: 'Plan' })
    expect(group).toHaveAccessibleDescription('Pick one')
    const [free, pro] = screen.getAllByRole<HTMLInputElement>('radio')
    expect(free!.name).toBe(pro!.name)
    expect(free).toBeChecked()
    expect(pro).toHaveAttribute('aria-invalid', 'true')
    await userEvent.click(pro!)
    expect(pro).toBeChecked()
    expect(free).not.toBeChecked()
    expect(onValueChange).toHaveBeenCalledWith('pro')
  })
})

describe('Slider and FileInput', () => {
  it('Slider writes its fill straight to the element and reports numbers', () => {
    const onValueChange = vi.fn()
    render(<Slider aria-label="Volume" defaultValue={20} onValueChange={onValueChange} />)
    const slider = screen.getByRole<HTMLInputElement>('slider', { name: 'Volume' })
    expect(slider.style.getPropertyValue('--greese-slider-fill')).toBe('20%')
    fireEvent.change(slider, { target: { value: '75' } })
    expect(slider.style.getPropertyValue('--greese-slider-fill')).toBe('75%')
    expect(onValueChange).toHaveBeenCalledWith(75)
  })

  it('Slider stays in step with a controlled value', () => {
    const Controlled = () => {
      const [v, setV] = useState(10)
      return <Slider aria-label="Level" min={0} max={50} value={v} onValueChange={setV} />
    }
    render(<Controlled />)
    const slider = screen.getByRole<HTMLInputElement>('slider')
    expect(slider.style.getPropertyValue('--greese-slider-fill')).toBe('20%')
    fireEvent.change(slider, { target: { value: '25' } })
    expect(slider.value).toBe('25')
    expect(slider.style.getPropertyValue('--greese-slider-fill')).toBe('50%')
  })

  it('Slider shows its value in a bubble that follows the thumb', () => {
    render(<Slider aria-label="Weight" defaultValue={20} valueLabel="always" unit="%" />)
    const slider = screen.getByRole<HTMLInputElement>('slider', { name: 'Weight' })
    // The two variables go on the wrapper, so the bubble's anchor — a sibling
    // of the input — can read them.
    const wrap = slider.parentElement!
    expect(wrap).toHaveClass('greese-Slider-wrap')
    expect(wrap.style.getPropertyValue('--greese-slider-ratio')).toBe('0.2')
    expect(screen.getByText('20%')).toBeInTheDocument()

    fireEvent.change(slider, { target: { value: '75' } })
    expect(wrap.style.getPropertyValue('--greese-slider-ratio')).toBe('0.75')
    expect(wrap.style.getPropertyValue('--greese-slider-fill')).toBe('75%')
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('Slider speaks its value with the unit, and the bubble is not announced', () => {
    render(<Slider aria-label="Weight" defaultValue={40} valueLabel="always" unit="%" />)
    const slider = screen.getByRole('slider', { name: 'Weight' })
    // One announcement, from the input, carrying the unit `aria-valuenow`
    // cannot. The bubble repeating it would be a second.
    expect(slider).toHaveAttribute('aria-valuetext', '40%')
    expect(slider).not.toHaveAccessibleDescription()
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull()
  })

  it('Slider adds no wrapper and no bubble by default', () => {
    render(<Slider aria-label="Volume" defaultValue={20} />)
    const slider = screen.getByRole<HTMLInputElement>('slider')
    expect(slider.parentElement).not.toHaveClass('greese-Slider-wrap')
    expect(slider).not.toHaveAttribute('aria-valuetext')
    expect(slider.style.getPropertyValue('--greese-slider-fill')).toBe('20%')
  })

  it("Slider's auto bubble follows the pointer and the keyboard", () => {
    render(<Slider aria-label="Weight" defaultValue={20} valueLabel="auto" unit="%" />)
    const slider = screen.getByRole('slider')
    const bubble = () => screen.getByText('20%')
    expect(bubble().matches(':popover-open')).toBe(false)
    fireEvent.pointerEnter(slider, { pointerType: 'mouse' })
    expect(bubble().matches(':popover-open')).toBe(true)
    fireEvent.pointerLeave(slider, { pointerType: 'mouse' })
    expect(bubble().matches(':popover-open')).toBe(false)
    fireEvent.focus(slider)
    expect(bubble().matches(':popover-open')).toBe(true)
    fireEvent.blur(slider)
    expect(bubble().matches(':popover-open')).toBe(false)
  })

  it('NumberField stacks its steppers, and NumberStepper splits them', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<NumberField label="Guests" defaultValue={2} />)
    const up = screen.getByRole('button', { name: 'Increase' })
    // Stacked: both carets sit in the one adornment at the end.
    expect(up.parentElement).toHaveClass('greese-NumberField-steppers')
    await user.click(up)
    expect(screen.getByRole('spinbutton')).toHaveValue('3')

    rerender(<NumberStepper label="Guests" defaultValue={2} />)
    // Split: a button at each end of the field, so neither is in the stack.
    const plus = screen.getByRole('button', { name: 'Increase' })
    const minus = screen.getByRole('button', { name: 'Decrease' })
    expect(plus.parentElement).not.toHaveClass('greese-NumberField-steppers')
    expect(minus.parentElement).not.toHaveClass('greese-NumberField-steppers')
    await user.click(minus)
    expect(screen.getByRole('spinbutton')).toHaveValue('1')
  })

  it('NumberField can drop its steppers entirely', () => {
    render(<NumberField label="Guests" defaultValue={2} steppers="none" />)
    expect(screen.queryByRole('button', { name: 'Increase' })).toBeNull()
    expect(screen.getByRole('spinbutton')).toHaveValue('2')
  })

  it('every control an EditableField renders takes its size', () => {
    const { container } = render(
      <>
        <EditableField label="On" type="switch" size="lg" value />
        <EditableField label="Tick" type="checkbox" size="lg" value />
        <EditableField label="Level" type="range" size="lg" value={3} />
      </>
    )
    // The size reaches each control, not just the text ones — a column of
    // mixed fields would otherwise be ragged.
    expect(container.querySelector('.greese-Switch--size-lg')).not.toBeNull()
    expect(container.querySelector('.greese-Checkbox--size-lg')).not.toBeNull()
    expect(container.querySelector('.greese-Slider--size-lg')).not.toBeNull()
  })

  it('FileInput is a native file input wired to its Field', () => {
    render(
      <Field label="Avatar">
        <FileInput accept="image/*" />
      </Field>
    )
    expect(screen.getByLabelText('Avatar')).toHaveAttribute('type', 'file')
  })

  it('FileInput labels its input with a Button and shows what was chosen', () => {
    const onChange = vi.fn()
    render(<FileInput aria-label="Receipt" onChange={onChange} className="mine" />)
    const input = screen.getByLabelText<HTMLInputElement>(/Receipt/)
    const button = screen.getByText('Choose file')
    expect(button.tagName).toBe('LABEL')
    expect(button).toHaveAttribute('for', input.id)
    expect(button).toHaveClass('greese-Button', 'greese-Button--outline')
    expect(input.parentElement).toHaveClass('greese-FileInput', 'mine')
    expect(screen.getByText('No file chosen')).toBeInTheDocument()

    const file = new File(['x'], 'receipt.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText('receipt.pdf')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('fileSummary names one file and counts several', () => {
    expect(fileSummary(null)).toBeUndefined()
    expect(fileSummary([])).toBeUndefined()
    expect(fileSummary([{ name: 'a.png' }])).toBe('a.png')
    expect(fileSummary([{ name: 'a.png' }, { name: 'b.png' }])).toBe('2 files')
  })

  it('FileInput has no axe violations in a Field', async () => {
    const { container } = render(
      <Field label="Avatar" description="A square image works best.">
        <FileInput accept="image/*" />
      </Field>
    )
    await expectNoAxeViolations(container)
  })
})

describe('native forms', () => {
  const Form = ({ onSubmit }: { onSubmit: (data: FormData) => void }) => (
    <form
      aria-label="Profile"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(new FormData(e.currentTarget))
      }}
    >
      <TextField label="Name" name="name" defaultValue="Ada" />
      <Field label="Bio">
        <Textarea name="bio" defaultValue="Hi" />
      </Field>
      <Field label="Country">
        <Select name="country" defaultValue="nz">
          <option value="nz">New Zealand</option>
          <option value="au">Australia</option>
        </Select>
      </Field>
      <CheckboxGroup label="Notify" name="notify" defaultValue={['email']}>
        <Checkbox value="email" label="Email" />
        <Checkbox value="sms" label="SMS" />
      </CheckboxGroup>
      <RadioGroup label="Plan" name="plan" defaultValue="pro">
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
      </RadioGroup>
      <Switch name="beta" label="Beta features" defaultChecked />
      <Field label="Volume">
        <Slider name="volume" defaultValue={30} />
      </Field>
      <Button type="submit">Save</Button>
    </form>
  )

  it('submits every control through FormData, no wiring needed', async () => {
    const onSubmit = vi.fn()
    render(<Form onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'SMS' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    const data = onSubmit.mock.calls[0]![0] as FormData
    expect(Object.fromEntries(data)).toMatchObject({
      name: 'Ada',
      bio: 'Hi',
      country: 'nz',
      plan: 'pro',
      beta: 'on',
      volume: '30',
    })
    expect(data.getAll('notify')).toEqual(['email', 'sms'])
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Form onSubmit={() => {}} />)
    await expectNoAxeViolations(container)
  })
})

describe('EditableField', () => {
  it('infers a control from the value when no type is given', () => {
    expect(inferEditableFieldType('hello')).toBe('text')
    expect(inferEditableFieldType('#ff0000')).toBe('color')
    expect(inferEditableFieldType('#f00')).toBe('color')
    expect(inferEditableFieldType(4)).toBe('number')
    expect(inferEditableFieldType(true)).toBe('checkbox')
    // null belongs to a cleared number field, whose type is always explicit.
    expect(inferEditableFieldType(null)).toBe('number')
  })

  it('keeps enough decimals for its own step', () => {
    expect(resolveDecimals(undefined)).toBe(2)
    expect(resolveDecimals(1)).toBe(2)
    // A step of 0.001 rounded to 2 places would refuse the values its own
    // arrows produce, so the limit widens instead.
    expect(resolveDecimals(0.001)).toBe(3)
    expect(resolveDecimals(0.5, 0)).toBe(1)
    expect(roundTo(1.23456, 2)).toBe(1.23)
    expect(wrapDegrees(-90)).toBe(270)
    expect(wrapDegrees(450)).toBe(90)
  })

  it('names the control once, and shows the label beside it', async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <EditableField
        label="Nickname"
        value="Ada"
        onValueChange={onValueChange}
        unit="px"
      />
    )
    const input = screen.getByRole('textbox', { name: 'Nickname' })
    expect(screen.getByText('Nickname')).toHaveAttribute('aria-hidden', 'true')
    // Focus selects the value, so typing replaces it rather than appending.
    await userEvent.type(input, '!')
    expect(onValueChange).toHaveBeenLastCalledWith('!')
    expect(screen.getByText('px')).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('rounds a number to its decimals and can be cleared', async () => {
    const onValueChange = vi.fn()
    render(
      <EditableField
        label="Scale"
        type="number"
        value={1}
        step={0.01}
        allowEmpty
        onValueChange={onValueChange}
      />
    )
    const input = screen.getByRole('spinbutton', { name: 'Scale' })
    await userEvent.clear(input)
    await userEvent.type(input, '2.129')
    fireEvent.blur(input)
    expect(onValueChange).toHaveBeenLastCalledWith(2.13)

    await userEvent.clear(input)
    fireEvent.blur(input)
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  it('will not report null from a number field without allowEmpty', async () => {
    const onValueChange = vi.fn()
    render(
      <>
        <EditableField
          label="Width"
          type="number"
          value={4}
          onValueChange={onValueChange}
        />
        <button type="button">elsewhere</button>
      </>
    )
    const input = screen.getByRole('spinbutton', {
      name: 'Width',
    }) as HTMLInputElement
    await userEvent.clear(input)
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }))
    expect(onValueChange).not.toHaveBeenCalledWith(null)
    // And the field does not sit there looking empty: leaving it puts back the
    // value still in force (NumberField re-reads it when the field is left).
    expect(input.value).toBe('4')
  })

  it('shows a range value with its unit', () => {
    const onValueChange = vi.fn()
    render(
      <EditableField
        label="Opacity"
        type="range"
        value={40}
        unit="%"
        onValueChange={onValueChange}
      />
    )
    expect(screen.getByText('40%')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider', { name: 'Opacity' }), {
      target: { value: '70' },
    })
    expect(onValueChange).toHaveBeenLastCalledWith(70)
  })

  it('reports an option’s own value, numbers included, and groups a select', async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <EditableField
        label="Weight"
        type="select"
        value={400}
        options={[
          { value: 400, label: 'Regular', group: 'Sans' },
          { value: 700, label: 'Bold', group: 'Sans' },
          { value: 300, label: 'Light', group: 'Serif' },
        ]}
        onValueChange={onValueChange}
      />
    )
    const groups = container.querySelectorAll('optgroup')
    expect([...groups].map((group) => group.label)).toEqual(['Sans', 'Serif'])
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Weight' }), '700')
    expect(onValueChange).toHaveBeenLastCalledWith(700)
  })

  it('renders choice as radios while the options are few, a dropdown when many', () => {
    const options = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ value: `o${i}`, label: `Option ${i}` }))
    const { rerender } = render(
      <EditableField
        label="Fit"
        type="choice"
        value="o0"
        options={options(3)}
        onValueChange={() => {}}
      />
    )
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    rerender(
      <EditableField
        label="Fit"
        type="choice"
        value="o0"
        options={options(4)}
        onValueChange={() => {}}
      />
    )
    expect(screen.getByRole('combobox', { name: 'Fit' })).toBeInTheDocument()
  })

  it('renders nothing when an option type has no options', () => {
    const { container } = render(
      <EditableField
        label="Fit"
        type="select"
        value=""
        options={[]}
        onValueChange={() => {}}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a placeholder instead of a value when the selection is mixed', () => {
    render(
      <EditableField
        label="Name"
        value="whatever"
        indeterminate
        onValueChange={() => {}}
      />
    )
    const input = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement
    expect(input.value).toBe('')
    expect(input).toHaveAttribute('placeholder', 'Mixed')
  })

  it('opens a picker from its swatch, and can clear the color', async () => {
    const onValueChange = vi.fn()
    render(
      <EditableField
        label="Fill"
        type="color"
        value="#ff0000"
        allowEmpty
        onValueChange={onValueChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Fill' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Hue' }), {
      target: { value: '240' },
    })
    expect(onValueChange).toHaveBeenLastCalledWith('#0000ff')

    await userEvent.click(screen.getByRole('button', { name: 'No color' }))
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  it('turns a dial with the arrow keys, wrapping at the top', async () => {
    const onValueChange = vi.fn()
    render(
      <EditableField
        label="Angle"
        type="knob"
        value={0}
        showValue={false}
        onValueChange={onValueChange}
      />
    )
    const dial = screen.getByRole('slider', { name: 'Angle' })
    dial.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith(1)
    await userEvent.keyboard('{ArrowLeft}')
    expect(onValueChange).toHaveBeenLastCalledWith(359)
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}')
    expect(onValueChange).toHaveBeenLastCalledWith(15)
  })

  it('reports a switch and a checkbox as booleans', async () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      <EditableField
        label="Loop"
        type="switch"
        value={false}
        onValueChange={onValueChange}
      />
    )
    await userEvent.click(screen.getByRole('switch', { name: 'Loop' }))
    expect(onValueChange).toHaveBeenLastCalledWith(true)

    rerender(<EditableField label="Loop" value={false} onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Loop' }))
    expect(onValueChange).toHaveBeenLastCalledWith(true)
  })

  it('keeps its own value when given only a defaultValue', async () => {
    const onValueChange = vi.fn()
    render(
      <EditableField label="Name" defaultValue="Ada" onValueChange={onValueChange} />
    )
    const input = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement
    expect(input.value).toBe('Ada')
    await userEvent.type(input, 'Grace')
    expect(input.value).toBe('Grace')
    expect(onValueChange).toHaveBeenLastCalledWith('Grace')
  })

  it('has no accessibility violations across its types', async () => {
    const { container } = render(
      <>
        <EditableField label="Text" value="a" onValueChange={() => {}} />
        <EditableField label="Number" type="number" value={1} onValueChange={() => {}} />
        <EditableField label="Range" type="range" value={1} onValueChange={() => {}} />
        <EditableField
          label="Color"
          type="color"
          value="#ff0000"
          onValueChange={() => {}}
        />
        <EditableField label="Angle" type="knob" value={0} onValueChange={() => {}} />
        <EditableField label="On" type="switch" value onValueChange={() => {}} />
        <EditableField
          label="Fit"
          type="segmented"
          value="a"
          options={[
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ]}
          onValueChange={() => {}}
        />
      </>
    )
    await expectNoAxeViolations(container)
  })
})
