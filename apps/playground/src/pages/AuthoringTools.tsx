import { useState, type JSX } from 'react'
import { CircleIcon, NavigateIcon, RectangleIcon, StarIcon } from '@greese/icons'
import { Toolbar, useToolHotkeys, type ToolDefinition } from '@greese/authoring'
import '@greese/react/base.css'
import '@greese/react/styles.css'
import '@greese/authoring/styles.css'

const tools: ToolDefinition[] = [
  { id: 'select', label: 'Select', hotkey: 'v', icon: <NavigateIcon /> },
  {
    id: 'shapes',
    label: 'Shapes',
    icon: <RectangleIcon />,
    subTools: [
      { id: 'rect', label: 'Rectangle', hotkey: 'r', icon: <RectangleIcon /> },
      { id: 'ellipse', label: 'Ellipse', hotkey: 'e', icon: <CircleIcon /> },
    ],
  },
  { id: 'star', label: 'Star', hotkey: 's', icon: <StarIcon /> },
]

/** @greese/authoring's Toolbar for e2e/authoring-tools.spec.ts. */
export const AuthoringTools = (): JSX.Element => {
  const [tool, setTool] = useState('select')
  useToolHotkeys(tools, setTool)
  return (
    <main style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1rem' }}>Tools</h1>
      <Toolbar tools={tools} value={tool} onValueChange={setTool} />
      <p data-testid="active">Active: {tool}</p>
      <label>
        Name <input />
      </label>
    </main>
  )
}
