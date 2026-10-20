import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ActionSelect, toast, Toaster } from '@greese-ui/react'
import { ArrowRightIcon, PlusIcon } from '@greese-ui/icons'

const meta = {
  title: 'Forms/ActionSelect',
  component: ActionSelect,
  args: {
    icon: <PlusIcon />,
    actionLabel: 'New project',
    onAction: () => {},
    selectLabel: 'Project',
    defaultValue: 'greese',
    options: [
      { value: 'greese', label: 'Greese UI', group: 'Recent' },
      { value: 'docs', label: 'Docs site', group: 'Recent' },
      { value: 'api', label: 'Public API' },
      { value: 'archive', label: 'Archive', disabled: true },
    ],
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [(Story) => <div style={{ maxInlineSize: '20rem' }}>{Story()}</div>],
} satisfies Meta<typeof ActionSelect>
export default meta

type Story = StoryObj<typeof meta>

/** Act with the button, choose with the native select. */
export const Playground: Story = {}

/**
 * A recipe: picking a format runs the export, and the button repeats the
 * last one.
 */
export const RepeatLastAction: Story = {
  render: function Render() {
    const [format, setFormat] = useState('png')
    const run = (value: string) => {
      setFormat(value)
      toast({ title: `Exported as ${value.toUpperCase()}`, tone: 'positive' })
    }
    return (
      <>
        <ActionSelect
          icon={<ArrowRightIcon />}
          actionLabel={`Export as ${format.toUpperCase()}`}
          onAction={() => run(format)}
          selectLabel="Export format"
          value={format}
          onValueChange={run}
          options={[
            { value: 'png', label: 'PNG' },
            { value: 'svg', label: 'SVG' },
            { value: 'pdf', label: 'PDF' },
          ]}
        />
        <Toaster />
      </>
    )
  },
}
