import type { Meta, StoryObj } from '@storybook/react-vite'
import { Step, Steps } from '@greese-ui/react'

/** One step. Steps sets its status from `current`; set it here to override. */
const meta = {
  title: 'Navigation/Step',
  component: Step,
  args: { children: 'Shipping', description: 'Standard, 2–4 days', status: 'current' },
  argTypes: {
    status: { control: 'inline-radio', options: ['complete', 'current', 'upcoming'] },
    tone: {
      control: 'select',
      options: [
        'neutral',
        'primary',
        'secondary',
        'tertiary',
        'accent',
        'positive',
        'negative',
        'warning',
        'info',
      ],
    },
  },
  decorators: [
    (Story) => (
      <Steps current={1}>
        <Step>Cart</Step>
        <Story />
        <Step>Payment</Step>
      </Steps>
    ),
  ],
} satisfies Meta<typeof Step>
export default meta

type Story = StoryObj<typeof meta>

/** The middle step. */
export const Playground: Story = {}

/** With a prefix above its marker. */
export const WithPrefix: Story = { args: { prefix: 'Step 2', prefixBefore: true } }
