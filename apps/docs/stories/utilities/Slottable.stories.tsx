import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon, Slot, Slottable } from '@greese/react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { ArrowRightIcon } from '@greese/icons'

/** A button-like component whose `asChild` child receives its props. */
const Action = ({
  asChild,
  children,
  ...props
}: ComponentPropsWithRef<'button'> & { asChild?: boolean; children?: ReactNode }) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      {...props}
      style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}
    >
      <Slottable>{children}</Slottable>
      <Icon>
        <ArrowRightIcon />
      </Icon>
    </Comp>
  )
}

/**
 * Marks which child of a Slot receives its props when the Slot has other
 * children too: here the link gets the styles, and the icon is kept beside it.
 */
const meta = {
  title: 'Utilities/Slottable',
  component: Slottable,
  render: () => (
    <Action asChild>
      <a href="#somewhere">A link with a trailing icon</a>
    </Action>
  ),
} satisfies Meta<typeof Slottable>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
