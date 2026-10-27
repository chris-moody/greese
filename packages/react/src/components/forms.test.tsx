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
import { Field } from './Field/Field.tsx'
import { FileInput } from './FileInput/FileInput.tsx'
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

  it('Textarea exposes rows to the autosize CSS', () => {
    render(<Textarea aria-label="Bio" rows={4} maxRows={10} />)
    const textarea = screen.getByLabelText('Bio')
    expect(textarea).toHaveClass('greese-Textarea--autosize')
    expect(textarea.style.getPropertyValue('--greese-textarea-rows')).toBe('4')
    expect(textarea.style.getPropertyValue('--greese-textarea-max-rows')).toBe('10')
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

  it('FileInput is a native file input wired to its Field', () => {
    render(
      <Field label="Avatar">
        <FileInput accept="image/*" />
      </Field>
    )
    expect(screen.getByLabelText('Avatar')).toHaveAttribute('type', 'file')
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
