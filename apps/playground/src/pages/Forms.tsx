import { useState, type JSX } from 'react'
import {
  Button,
  ButtonGroup,
  Checkbox,
  CheckboxGroup,
  Field,
  FileInput,
  IconButton,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Stack,
  Switch,
  Textarea,
  TextField,
  ToggleButton,
} from '@greese/react'
import { PlusIcon } from '@greese/icons'
import '@greese/react/base.css'
import '@greese/react/styles.css'

/** Form fixtures for e2e/forms.spec.ts: keyboard, touch and submission. */
export const Forms = (): JSX.Element => {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null)
  return (
    <main style={{ padding: '1rem', maxInlineSize: '40rem' }}>
      <form
        aria-label="Profile"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          setSubmitted({ ...Object.fromEntries(data), notify: data.getAll('notify') })
        }}
      >
        <Stack gap={5}>
          <TextField label="Name" name="name" defaultValue="Ada" />
          <TextField label="Small input" name="small" size="sm" />
          <Field label="Bio">
            <Textarea name="bio" />
          </Field>
          <Field label="Country">
            <Select name="country" defaultValue="nz">
              <option value="nz">New Zealand</option>
              <option value="au">Australia</option>
            </Select>
          </Field>
          <CheckboxGroup label="Notify me" name="notify" defaultValue={['email']}>
            <Checkbox value="email" label="Email" />
            <Checkbox value="sms" label="SMS" />
          </CheckboxGroup>
          <RadioGroup label="Plan" name="plan" defaultValue="free" direction="row">
            <Radio value="free" label="Free" />
            <Radio value="pro" label="Pro" />
            <Radio value="team" label="Team" />
          </RadioGroup>
          <Switch name="beta" label="Beta features" />
          <Field label="Volume">
            <Slider name="volume" defaultValue={50} />
          </Field>
          <Field label="Avatar">
            <FileInput name="avatar" accept="image/*" />
          </Field>
          <ButtonGroup aria-label="Formatting" attached>
            <ToggleButton>Bold</ToggleButton>
            <ToggleButton>Italic</ToggleButton>
          </ButtonGroup>
          <Stack direction="row" gap={2}>
            <Button type="submit">Save</Button>
            <Button size="sm" variant="outline">
              Small button
            </Button>
            <IconButton label="Add item" size="sm">
              <PlusIcon strokeWidth={2} />
            </IconButton>
          </Stack>
        </Stack>
      </form>
      <output data-testid="result">{submitted && JSON.stringify(submitted)}</output>
    </main>
  )
}
