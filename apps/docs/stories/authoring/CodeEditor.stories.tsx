import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { EditableField } from '@greese/react'
import { CodeEditor, type CodeRange } from '@greese/authoring'
import '@greese/authoring/styles.css'

const star = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <!-- A star, and a ring around it -->
  <circle cx="12" cy="12" r="10" fill="none" stroke="#6366f1"/>
  <path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>
</svg>`

/** Where each shape's markup is: what a canvas selection lights in the code. */
const shapes = ['circle', 'path'].map((tag) => {
  const start = star.indexOf(`<${tag}`)
  return { tag, range: { start, end: star.indexOf('/>', start) + 2 } }
})

const meta = {
  title: 'Authoring/CodeEditor',
  component: CodeEditor,
  args: {
    value: star,
    language: 'xml',
    rows: 8,
    'aria-label': 'SVG markup',
    invalid: false,
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    value: { control: false },
    onChange: { control: false },
    onSelectionChange: { control: false },
    highlight: { control: false },
    selection: { control: false },
    language: { control: 'inline-radio', options: ['xml', 'css', 'scss', 'js', 'ts'] },
  },
} satisfies Meta<typeof CodeEditor>
export default meta

type Story = StoryObj<typeof meta>

/** Code with highlighting and no dependency: type in it, and the colours follow. */
export const Playground: Story = {
  render: function Playground(args) {
    const [code, setCode] = useState(star)
    return <CodeEditor {...args} value={code} onChange={setCode} />
  },
}

/**
 * The code and a canvas in step. Choose a shape and its markup lights up and
 * is selected; move the caret in the code and the shape it's in is chosen.
 */
export const Synced: Story = {
  render: function Synced(args) {
    const [chosen, setChosen] = useState('path')
    const [selection, setSelection] = useState<CodeRange>()
    const range = shapes.find((shape) => shape.tag === chosen)?.range
    return (
      <div style={{ display: 'grid', gap: 'var(--greese-space-2)' }}>
        <EditableField
          type="segmented"
          label="Selected shape"
          value={chosen}
          onValueChange={(tag) => {
            setChosen(String(tag))
            setSelection(shapes.find((shape) => shape.tag === tag)?.range)
          }}
          options={shapes.map((shape) => ({ value: shape.tag, label: shape.tag }))}
        />
        <CodeEditor
          {...args}
          readOnly
          highlight={range}
          selection={selection}
          onSelectionChange={({ start }) => {
            const inside = shapes.find(
              (shape) => start >= shape.range.start && start < shape.range.end
            )
            if (inside) setChosen(inside.tag)
          }}
        />
      </div>
    )
  },
}

/** A compile error's line, marked. */
export const Invalid: Story = {
  args: {
    language: 'scss',
    value: '.card {\n  padding: $gap\n  color: red;\n}',
    invalid: true,
    markLine: 2,
    'aria-label': 'Styles',
  },
}
