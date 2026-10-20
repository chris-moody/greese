import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, ButtonGroup } from '@greese/react'

const meta = {
  title: 'Forms/ButtonGroup',
  component: ButtonGroup,
  args: {
    'aria-label': 'Actions',
    children: (
      <>
        <Button variant="outline" tone="neutral">
          Cancel
        </Button>
        <Button>Confirm</Button>
      </>
    ),
  },
} satisfies Meta<typeof ButtonGroup>
export default meta

type Story = StoryObj<typeof meta>

export const Spaced: Story = {}

/** `attached` joins the buttons into one segmented control. */
export const Attached: Story = {
  args: {
    attached: true,
    children: (
      <>
        <Button variant="outline" tone="neutral">
          Day
        </Button>
        <Button variant="outline" tone="neutral">
          Week
        </Button>
        <Button variant="outline" tone="neutral">
          Month
        </Button>
      </>
    ),
  },
}

export const Vertical: Story = { args: { orientation: 'vertical', attached: true } }
