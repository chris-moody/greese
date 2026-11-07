import type { Meta, StoryObj } from '@storybook/react-vite'
import { Highlighted } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/Highlighted',
  component: Highlighted,
  args: {
    value: 'const star = { points: 5, inner: 0.4 } // a regular star',
    language: 'ts',
  },
  argTypes: {
    language: { control: 'inline-radio', options: ['xml', 'css', 'scss', 'js', 'ts'] },
  },
  decorators: [
    (Story) => (
      <pre className="greese-CodeEditor-static sb-unstyled">
        <Story />
      </pre>
    ),
  ],
} satisfies Meta<typeof Highlighted>
export default meta

type Story = StoryObj<typeof meta>

/** Read-only code in the code palette, inside a `pre` with `greese-CodeEditor-static`. */
export const Playground: Story = {}

/** SVG markup. */
export const Markup: Story = {
  args: {
    value: '<rect x="2" y="2" width="20" height="20" rx="4" fill="#38bdf8"/>',
    language: 'xml',
  },
}
