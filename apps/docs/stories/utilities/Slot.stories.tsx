import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon, Slot, Slottable } from '@greese-ui/react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { ArrowIcon } from '../_shared/fixtures.tsx'

/** A component with an `asChild` prop, built on Slot, the way GreeseUI's own are. */
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
} satisfies Meta<typeof Slot>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Slot merges its props (className, style, handlers, ref) onto its one child.
 * Here the same `Action` renders a button, then, with `asChild`, a link.
 */
export const AsChild: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Action icon={<ArrowIcon />}>A button</Action>
      <Action asChild icon={<ArrowIcon />}>
        <a href="#somewhere">A link</a>
      </Action>
    </div>
  ),
}
