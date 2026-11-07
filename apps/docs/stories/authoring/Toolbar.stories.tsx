import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  CircleIcon,
  HexagonIcon,
  NavigateIcon,
  PaintBucketIcon,
  PencilIcon,
  RectangleIcon,
  StarIcon,
  TextIcon,
  ZoomInIcon,
} from '@greese/icons'
import { Toolbar, useToolHotkeys, type ToolDefinition } from '@greese/authoring'
import '@greese/authoring/styles.css'

/** A drawing editor's tools: a group of shapes, and three kinds set apart. */
const tools: ToolDefinition[] = [
  { id: 'select', label: 'Select', hotkey: 'v', icon: <NavigateIcon />, group: 'pick' },
  { id: 'text', label: 'Text', hotkey: 't', icon: <TextIcon />, group: 'draw' },
  {
    id: 'shapes',
    label: 'Shapes',
    icon: <RectangleIcon />,
    group: 'draw',
    subTools: [
      { id: 'rect', label: 'Rectangle', hotkey: 'r', icon: <RectangleIcon /> },
      { id: 'ellipse', label: 'Ellipse', hotkey: 'e', icon: <CircleIcon /> },
      { id: 'polygon', label: 'Polygon', hotkey: 'p', icon: <HexagonIcon /> },
      { id: 'star', label: 'Star', hotkey: 's', icon: <StarIcon /> },
    ],
  },
  { id: 'pencil', label: 'Pencil', hotkey: 'b', icon: <PencilIcon />, group: 'draw' },
  {
    id: 'fill',
    label: 'Paint Bucket',
    hotkey: 'g',
    icon: <PaintBucketIcon />,
    group: 'paint',
  },
  { id: 'zoom', label: 'Zoom', hotkey: 'z', icon: <ZoomInIcon />, group: 'view' },
]

const meta = {
  title: 'Authoring/Toolbar',
  component: Toolbar,
  args: {
    tools,
    value: 'select',
    onValueChange: () => undefined,
    orientation: 'vertical',
    label: 'Tools',
  },
  argTypes: {
    tools: { control: false },
    value: { control: false },
    onValueChange: { control: false },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
  },
} satisfies Meta<typeof Toolbar>
export default meta

type Story = StoryObj<typeof meta>

/**
 * An editor's tools. The arrows move between them and the active one is
 * pressed; Shapes is a group, with the rest of its tools behind the corner
 * arrow, a right-click or the arrow across the bar. The hotkeys work too.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [tool, setTool] = useState('select')
    useToolHotkeys(tools, setTool)
    return <Toolbar {...args} value={tool} onValueChange={setTool} />
  },
}

/** Along the top of an editor, the arrows go left and right. */
export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: function Horizontal(args) {
    const [tool, setTool] = useState('ellipse')
    return <Toolbar {...args} value={tool} onValueChange={setTool} />
  },
}
