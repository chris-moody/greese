import type { Meta, StoryObj } from '@storybook/react-vite'
import { Step, Steps } from '@greese/react'
import { StarIcon } from '@greese/icons'

const meta = {
  title: 'Navigation/Steps',
  component: Steps,
  subcomponents: { Step },
  args: {
    current: 1,
    'aria-label': 'Checkout',
    children: (
      <>
        <Step>Cart</Step>
        <Step>Shipping</Step>
        <Step>Payment</Step>
        <Step>Done</Step>
      </>
    ),
  },
  argTypes: {
    current: { control: { type: 'number', min: 0, max: 4 } },
    direction: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    markers: { control: 'inline-radio', options: ['numbers', 'dots'] },
  },
} satisfies Meta<typeof Steps>
export default meta

type Story = StoryObj<typeof meta>

/** The stages of a process: completed, current, upcoming. */
export const Playground: Story = {}

export const Vertical: Story = {
  args: {
    direction: 'vertical',
    current: 2,
    children: (
      <>
        <Step description="Two items">Cart</Step>
        <Step description="Standard, 2–4 days">Shipping</Step>
        <Step description="Card ending 4242">Payment</Step>
        <Step>Confirmation</Step>
      </>
    ),
  },
}

/** A step's own `status` and `tone` override the derived ones. */
export const WithAProblem: Story = {
  args: {
    current: 2,
    children: (
      <>
        <Step>Upload</Step>
        <Step>Check</Step>
        <Step tone="negative" marker="!">
          Publish failed
        </Step>
      </>
    ),
  },
}

/**
 * A timeline: no `current`, so steps are events in their own tones; dots for
 * markers, and times in a column before them (`prefixBefore`).
 */
export const Timeline: Story = {
  args: {
    current: undefined,
    direction: 'vertical',
    markers: 'dots',
    'aria-label': 'Activity',
    style: { maxInlineSize: '36rem' },
    children: (
      <>
        <Step
          prefix={<time dateTime="2026-10-19T09:12">09:12</time>}
          prefixBefore
          tone="positive"
          description="Version 1.4 is live in every region."
        >
          Deployed
        </Step>
        <Step prefix={<time dateTime="2026-10-19T08:55">08:55</time>} prefixBefore>
          Build passed
        </Step>
        <Step
          prefix={<time dateTime="2026-10-19T08:31">08:31</time>}
          prefixBefore
          tone="warning"
          marker={<StarIcon />}
          description="Two approvals from the core team."
        >
          Review approved
        </Step>
        <Step
          prefix={<time dateTime="2026-10-18">Yesterday</time>}
          prefixBefore
          tone="neutral"
        >
          Opened
        </Step>
      </>
    ),
  },
}

/** Without `prefixBefore`, the prefix sits above each title instead. */
export const TimelinePrefixAbove: Story = {
  args: {
    current: undefined,
    direction: 'vertical',
    markers: 'dots',
    'aria-label': 'Activity',
    style: { maxInlineSize: '36rem' },
    children: (
      <>
        <Step prefix="Today, 09:12" tone="positive" description="Version 1.4 is live.">
          Deployed
        </Step>
        <Step prefix="Today, 08:55">Build passed</Step>
        <Step prefix="Yesterday" tone="neutral">
          Opened
        </Step>
      </>
    ),
  },
}

/** Horizontal, with dates above the markers. */
export const Roadmap: Story = {
  args: {
    current: 1,
    markers: 'dots',
    'aria-label': 'Roadmap',
    children: (
      <>
        <Step prefix="Q1" prefixBefore description="Shipped">
          Beta
        </Step>
        <Step prefix="Q2" prefixBefore description="In progress">
          1.0
        </Step>
        <Step prefix="Q3" prefixBefore>
          Plugins
        </Step>
        <Step prefix="Q4" prefixBefore>
          2.0
        </Step>
      </>
    ),
  },
}
