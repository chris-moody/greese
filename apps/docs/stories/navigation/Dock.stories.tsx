import type { Meta, StoryObj } from '@storybook/react-vite'
import { Dock, DockItem } from '@greese/react'
import { BellIcon, HomeIcon, SearchIcon, UserIcon } from '@greese/icons'

const meta = {
  title: 'Navigation/Dock',
  component: Dock,
  subcomponents: { DockItem },
  // Static in the docs; `fixed` (the default) pins it to the viewport's bottom.
  args: {
    position: 'static',
    children: (
      <>
        <DockItem href="#home" icon={<HomeIcon />} current>
          Home
        </DockItem>
        <DockItem href="#search" icon={<SearchIcon />}>
          Search
        </DockItem>
        <DockItem href="#alerts" icon={<BellIcon />}>
          Alerts
        </DockItem>
        <DockItem href="#profile" icon={<UserIcon />}>
          Profile
        </DockItem>
      </>
    ),
  },
  argTypes: {
    position: { control: 'inline-radio', options: ['fixed', 'static'] },
    hideFrom: { control: 'inline-radio', options: [undefined, 'sm', 'md', 'lg', 'xl'] },
  },
} satisfies Meta<typeof Dock>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
