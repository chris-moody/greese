import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SymbolCreateDialog } from '@greese/authoring'
import { Button, Text } from '@greese/react'

const kinds = [
  { value: 'graphic', label: 'Graphic' },
  { value: 'animation', label: 'Animation' },
]

const meta = {
  title: 'Authoring/SymbolCreateDialog',
  component: SymbolCreateDialog,
  args: {
    open: false,
    types: kinds,
    symbolType: 'graphic',
    onChangeSymbolType: () => undefined,
    onClose: () => undefined,
    onConfirm: () => undefined,
  },
  argTypes: {
    onChangeSymbolType: { control: false },
    onClose: { control: false },
    onConfirm: { control: false },
  },
} satisfies Meta<typeof SymbolCreateDialog>
export default meta

type Story = StoryObj<typeof meta>

/** Choose a kind, name it, Create: what was made shows below. */
export const Playground: Story = {
  render: function Playground(args) {
    const [open, setOpen] = useState(false)
    const [kind, setKind] = useState('graphic')
    const [name, setName] = useState('Symbol 1')
    const [made, setMade] = useState('nothing yet')
    return (
      <>
        <Button onClick={() => setOpen(true)}>Add symbol</Button>
        <Text variant="caption">Made: {made}</Text>
        <SymbolCreateDialog
          {...args}
          open={open}
          symbolType={kind}
          onChangeSymbolType={setKind}
          name={name}
          onChangeName={setName}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            setMade(`${kind} "${name}"`)
            setOpen(false)
          }}
        />
      </>
    )
  },
}
