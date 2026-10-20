import type { Meta, StoryObj } from '@storybook/react-vite'
import { SpeedDial, SpeedDialAction } from '@greese/react'
import { DocumentIcon, FolderIcon, UserIcon } from '@greese/icons'

const meta = {
  title: 'Overlays/SpeedDial',
  component: SpeedDial,
  subcomponents: { SpeedDialAction },
  // Static in the docs; `fixed` (the default) floats it in the corner.
  args: {
    label: 'Create',
    position: 'static',
    children: (
      <>
        <SpeedDialAction label="Document" icon={<DocumentIcon />} />
        <SpeedDialAction label="Folder" icon={<FolderIcon />} />
        <SpeedDialAction label="Invite someone" icon={<UserIcon />} />
      </>
    ),
  },
  argTypes: { position: { control: 'inline-radio', options: ['fixed', 'static'] } },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingBlockStart: '12rem',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SpeedDial>
export default meta

type Story = StoryObj<typeof meta>

/** Press the button; Escape or a click outside closes it. */
export const Playground: Story = {}
