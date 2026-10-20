import type { Meta, StoryObj } from '@storybook/react-vite'
import { Embed } from '@greese/react'

const doc = `data:text/html,${encodeURIComponent(
  '<body style="margin:0;display:grid;place-items:center;font:16px system-ui;background:#eef">An embedded page</body>'
)}`

const meta = {
  title: 'Content/Embed',
  component: Embed,
  args: { title: 'Example embed', src: doc },
  decorators: [(Story) => <div style={{ maxInlineSize: '32rem' }}>{Story()}</div>],
} satisfies Meta<typeof Embed>
export default meta

type Story = StoryObj<typeof meta>

/** Third-party frames (YouTube, maps), lazy-loaded; `title` is required. */
export const Playground: Story = {}
