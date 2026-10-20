import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Drawer, Text } from '@greese/react'

const meta = {
  title: 'Overlays/Drawer',
  component: Drawer,
  args: {
    trigger: <Button variant="outline">Filters</Button>,
    title: 'Filters',
    placement: { xs: 'bottom', md: 'end' },
    footer: <Button fullWidth>Apply</Button>,
    children: <Text tone="muted">Filter controls go here.</Text>,
  },
} satisfies Meta<typeof Drawer>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A bottom sheet on phones and a side panel from md. Resize the viewport.
 * Drag the header (or the sheet's handle) toward the edge to dismiss.
 */
export const Responsive: Story = {}

export const Start: Story = { args: { placement: 'start', title: 'Navigation' } }
