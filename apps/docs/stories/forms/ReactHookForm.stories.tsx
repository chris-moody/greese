import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Checkbox, Field, Select, Stack, TextField } from '@sauce-ui/react'

interface SignUp {
  email: string
  role: string
  terms: boolean
}

/**
 * SauceUI controls are native elements and forward `ref` to them, so
 * `register()` works with no adapters or Controller wrappers.
 */
const SignUpForm = () => {
  const [result, setResult] = useState<SignUp | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUp>({ defaultValues: { role: '' } })

  return (
    <form onSubmit={handleSubmit(async (data) => setResult(data))} noValidate>
      <Stack gap={5} maxW="28rem">
        <TextField
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
          })}
        />
        <Field label="Role" error={errors.role?.message}>
          <Select
            placeholder="Choose a role"
            {...register('role', { required: 'Pick a role' })}
          >
            <option value="dev">Developer</option>
            <option value="design">Designer</option>
          </Select>
        </Field>
        <Checkbox
          label="I accept the terms"
          invalid={Boolean(errors.terms)}
          description={errors.terms?.message}
          {...register('terms', { required: 'You must accept the terms' })}
        />
        <Button type="submit" loading={isSubmitting}>
          Create account
        </Button>
        {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      </Stack>
    </form>
  )
}

const meta = {
  title: 'Forms/Recipes/React Hook Form',
  component: SignUpForm,
} satisfies Meta<typeof SignUpForm>
export default meta

export const Registration: StoryObj<typeof meta> = {}
