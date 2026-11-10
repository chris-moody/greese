import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { TextBoxEditor } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/TextBoxEditor',
  component: TextBoxEditor,
  args: {
    rect: { x: 16, y: 16, width: 260, height: 72 },
    defaultValue: 'Words edited where they are drawn: click one to put the caret there.',
    'aria-label': 'Text',
  },
  argTypes: {
    rect: { control: false },
    onValueChange: { control: false },
    onDone: { control: false },
    caretPoint: { control: false },
  },
} satisfies Meta<typeof TextBoxEditor>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A text box on a stage, open for editing. Escape or clicking away closes it
 * and shows the words as drawn; click them to edit again, the caret where
 * you clicked.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [text, setText] = useState<string>(args.defaultValue ?? '')
    const [caret, setCaret] = useState<{ x: number; y: number }>()
    const [open, setOpen] = useState(true)
    const font = { font: '20px/1.2 sans-serif' }
    return (
      <div style={{ position: 'relative', blockSize: 160 }}>
        {open ? (
          <TextBoxEditor
            {...args}
            defaultValue={text}
            caretPoint={caret}
            style={font}
            onValueChange={setText}
            onDone={(value) => {
              setText(value)
              setOpen(false)
            }}
          />
        ) : (
          <button
            type="button"
            aria-label={`Edit: ${text}`}
            style={{
              ...font,
              position: 'absolute',
              insetInlineStart: args.rect.x,
              insetBlockStart: args.rect.y,
              inlineSize: args.rect.width,
              padding: 0,
              margin: 0,
              color: 'inherit',
              textAlign: 'start',
              whiteSpace: 'pre-wrap',
              cursor: 'text',
              background: 'none',
              border: 0,
            }}
            // A click puts the caret where it was; a key, at the end.
            onClick={(event) => {
              setCaret(event.detail ? { x: event.clientX, y: event.clientY } : undefined)
              setOpen(true)
            }}
          >
            {text}
          </button>
        )}
      </div>
    )
  },
}
