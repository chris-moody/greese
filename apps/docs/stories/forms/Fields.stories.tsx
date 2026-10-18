import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Checkbox,
  CheckboxGroup,
  Field,
  FileInput,
  Input,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Stack,
  Switch,
  Textarea,
  TextField,
} from '@sauce-ui/react'
import { SearchIcon } from './icons.tsx'

const meta = { title: 'Forms/Fields' } satisfies Meta
export default meta

type Story = StoryObj

export const TextInputs: Story = {
  render: () => (
    <Stack gap={5} maxW="28rem">
      <TextField label="Full name" name="name" autoComplete="name" />
      <TextField
        label="Email"
        type="email"
        description="We'll only use it for receipts."
        error="Enter an email address like name@example.com"
        required
      />
      <Field label="Search" hideLabel>
        <Input type="search" placeholder="Search…" startAdornment={<SearchIcon />} />
      </Field>
      <Field label="Price">
        <Input inputMode="decimal" startAdornment="$" endAdornment="NZD" />
      </Field>
      <Stack direction="row" gap={2}>
        <TextField label="Small" size="sm" />
        <TextField label="Large" size="lg" />
      </Stack>
    </Stack>
  ),
}

export const TextareaSelectFileSlider: Story = {
  render: () => (
    <Stack gap={5} maxW="28rem">
      <Field
        label="Bio"
        description="Grows as you type (where supported), up to 8 lines."
      >
        <Textarea maxRows={8} placeholder="A few words about you" />
      </Field>
      <Field label="Country">
        <Select placeholder="Choose a country" required>
          <option value="nz">New Zealand</option>
          <option value="au">Australia</option>
          <option value="us">United States</option>
        </Select>
      </Field>
      <Field label="Avatar">
        <FileInput accept="image/*" />
      </Field>
      <Field label="Volume">
        <Slider defaultValue={40} />
      </Field>
    </Stack>
  ),
}

export const Choices: Story = {
  render: () => (
    <Stack gap={6}>
      <Checkbox label="I accept the terms" description="You can withdraw at any time." />
      <Checkbox label="Select all" indeterminate />
      <CheckboxGroup
        label="Notify me by"
        defaultValue={['email']}
        direction={{ xs: 'column', md: 'row' }}
      >
        <Checkbox value="email" label="Email" />
        <Checkbox value="sms" label="SMS" />
        <Checkbox value="push" label="Push notification" />
      </CheckboxGroup>
      <RadioGroup
        label="Plan"
        defaultValue="pro"
        error="The Team plan needs 3 or more seats."
      >
        <Radio value="free" label="Free" description="For trying things out" />
        <Radio value="pro" label="Pro" description="For individuals" />
        <Radio value="team" label="Team" description="Billed per seat" />
      </RadioGroup>
      <Switch label="Dark mode" description="Applies immediately" />
    </Stack>
  ),
}
