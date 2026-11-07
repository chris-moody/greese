import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ZoomControl } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/ZoomControl',
  component: ZoomControl,
  args: { zoom: 1, onZoomChange: () => undefined, onResetView: () => undefined },
  argTypes: { onZoomChange: { control: false }, onResetView: { control: false } },
} satisfies Meta<typeof ZoomControl>
export default meta

type Story = StoryObj<typeof meta>

/** The zoom as a percentage, and a button that puts the view back at 100%. */
export const Playground: Story = {
  render: function Playground(args) {
    const [zoom, setZoom] = useState(1)
    return (
      <ZoomControl
        {...args}
        zoom={zoom}
        onZoomChange={setZoom}
        onResetView={() => setZoom(1)}
      />
    )
  },
}
