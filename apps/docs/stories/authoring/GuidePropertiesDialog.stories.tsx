import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { GuidePropertiesDialog, type AuthoringGuide } from '@greese/authoring'
import { Button, Text } from '@greese/react'

const guide: AuthoringGuide = {
  id: 'g1',
  axis: 'h',
  pos: 120,
  scope: 'root',
  name: 'Baseline',
}

const meta = {
  title: 'Authoring/GuidePropertiesDialog',
  component: GuidePropertiesDialog,
  args: {
    guide: null,
    onClose: () => undefined,
    onSave: () => undefined,
    onDelete: () => undefined,
  },
  argTypes: {
    guide: { control: false },
    onClose: { control: false },
    onSave: { control: false },
    onDelete: { control: false },
  },
} satisfies Meta<typeof GuidePropertiesDialog>
export default meta

type Story = StoryObj<typeof meta>

/** A guide's name, position and global flag, with Delete. What was saved shows below. */
export const Playground: Story = {
  render: function Playground(args) {
    const [editing, setEditing] = useState<AuthoringGuide | null>(null)
    const [result, setResult] = useState('nothing yet')
    return (
      <>
        <Button onClick={() => setEditing(guide)}>Edit “Baseline”</Button>
        <Text variant="caption">Last change: {result}</Text>
        <GuidePropertiesDialog
          {...args}
          guide={editing}
          onClose={() => setEditing(null)}
          onSave={(name, isGlobal, pos) =>
            setResult(`${name} at ${pos}${isGlobal ? ', global' : ''}`)
          }
          onDelete={() => setResult('deleted')}
        />
      </>
    )
  },
}
