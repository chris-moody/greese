import type { Meta, StoryObj } from '@storybook/react-vite'
import { Dock, DockItem } from '@greese-ui/react'
import { HomeIcon, SearchIcon, UserIcon } from '@greese-ui/icons'

/** One destination in a Dock. `asChild` renders your router's link. */
const meta = {
  title: 'Navigation/DockItem',
  component: DockItem,
  args: { href: '#search', icon: <SearchIcon />, children: 'Search', current: true },
  decorators: [
    (Story) => (
      <Dock position="static">
        <DockItem href="#home" icon={<HomeIcon />}>
          Home
        </DockItem>
        <Story />
        <DockItem href="#profile" icon={<UserIcon />}>
          Profile
        </DockItem>
      </Dock>
    ),
  ],
} satisfies Meta<typeof DockItem>
export default meta

type Story = StoryObj<typeof meta>

/** The middle item, current. */
export const Playground: Story = {}
