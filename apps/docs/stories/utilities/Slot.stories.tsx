import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon, Slot, Slottable } from '@greese/react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { ArrowRightIcon } from '@greese/icons'

/** A component with an `asChild` prop, built on Slot, the way greese ui's own are. */
const Action = ({
  asChild,
  icon,
  children,
  ...props
}: ComponentPropsWithRef<'button'> & { asChild?: boolean; icon?: ReactNode }) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      {...props}
      style={{
        display: 'inline-flex',
        gap: '0.5rem',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        ...props.style,
      }}
    >
      <Slottable>{children}</Slottable>
      {icon && <Icon>{icon}</Icon>}
    </Comp>
  )
}

const meta = {
  title: 'Utilities/Slot',
  component: Slot,
  subcomponents: { Slottable },
  args: { title: 'Merged onto the link', style: { fontWeight: 600 } },
} satisfies Meta<typeof Slot>
export default meta

type Story = StoryObj<typeof meta>

/** Its props land on its one child: here the link gets the title and style. */
export const Playground: Story = {
  render: (args) => (
    <Slot {...args}>
      <a href="#somewhere">A link</a>
    </Slot>
  ),
}

/**
 * Slot merges its props (className, style, handlers, ref) onto its one child.
 * Here the same `Action` renders a button, then, with `asChild`, a link.
 */
export const AsChild: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Action icon={<ArrowRightIcon />}>A button</Action>
      <Action asChild icon={<ArrowRightIcon />}>
        <a href="#somewhere">A link</a>
      </Action>
    </div>
  ),
}
