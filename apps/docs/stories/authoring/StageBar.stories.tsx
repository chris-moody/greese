import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { StageBar } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/StageBar',
  component: StageBar,
  args: {
    zoom: 1,
    layouts: [
      { id: 'design', name: 'Design' },
      { id: 'split', name: 'Split' },
    ],
    activeLayoutId: 'design',
    canSave: false,
    onZoomChange: () => undefined,
    onResetView: () => undefined,
    onSelectLayout: () => undefined,
    onSaveLayout: () => undefined,
  },
  argTypes: {
    onZoomChange: { control: false },
    onResetView: { control: false },
    onSelectLayout: { control: false },
    onSaveLayout: { control: false },
  },
} satisfies Meta<typeof StageBar>
export default meta

type Story = StoryObj<typeof meta>

/** The stage's controls: zoom, then the panel layout. */
export const Playground: Story = {
  render: function Playground(args) {
    const [zoom, setZoom] = useState(1)
    const [layout, setLayout] = useState('design')
    return (
      <StageBar
        {...args}
        zoom={zoom}
        onZoomChange={setZoom}
        onResetView={() => setZoom(1)}
        activeLayoutId={layout}
        onSelectLayout={setLayout}
      />
    )
  },
}
