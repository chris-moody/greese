import type { Meta, StoryObj } from '@storybook/react-vite'
import { SpeedDial, SpeedDialAction } from '@greese-ui/react'
import { DocumentIcon, FolderIcon } from '@greese-ui/icons'

/** One action in a SpeedDial: a labelled round button. Open the dial to see it. */
const meta = {
  title: 'Overlays/SpeedDialAction',
  component: SpeedDialAction,
  args: { label: 'Document', icon: <DocumentIcon /> },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingBlockStart: '10rem',
        }}
      >
        <SpeedDial label="Create" position="static">
          <Story />
          <SpeedDialAction label="Folder" icon={<FolderIcon />} />
        </SpeedDial>
      </div>
    ),
  ],
} satisfies Meta<typeof SpeedDialAction>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
