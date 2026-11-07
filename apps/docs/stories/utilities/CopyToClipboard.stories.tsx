import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button, Code, CopyToClipboard, IconButton, Stack, Text } from '@greese/react'
import { CheckIcon, CopyIcon } from '@greese/icons'

const meta = {
  title: 'Utilities/CopyToClipboard',
  component: CopyToClipboard,
  args: {
    text: 'npm install @greese/react',
    copiedMessage: 'Copied',
    failedMessage: "Couldn't copy",
    announce: true,
    resetAfter: 2000,
    children: <Button startIcon={<CopyIcon />}>Copy the install command</Button>,
  },
} satisfies Meta<typeof CopyToClipboard>
export default meta

type Story = StoryObj<typeof meta>

/** Its one child copies `text` on click, and the outcome is read out. */
export const Playground: Story = {}

/**
 * A function child gets the copy's state: here the icon turns into a check
 * for a moment once the text is on the clipboard.
 */
export const IconFeedback: Story = {
  render: () => (
    <Stack direction="row" gap={2} align="center">
      <Code>npm install @greese/react</Code>
      <CopyToClipboard text="npm install @greese/react">
        {({ copied }) => (
          <IconButton label="Copy the install command" variant="ghost" tone="neutral">
            {copied ? <CheckIcon /> : <CopyIcon />}
          </IconButton>
        )}
      </CopyToClipboard>
    </Stack>
  ),
}

/**
 * `text` can be a function, read at the moment of the click, and `onCopy`
 * hears what was copied.
 */
export const LatestValue: Story = {
  render: function LatestValue() {
    const [count, setCount] = useState(1)
    const [last, setLast] = useState('nothing yet')
    return (
      <Stack gap={2} align="start">
        <Stack direction="row" gap={2}>
          <Button variant="soft" onClick={() => setCount((n) => n + 1)}>
            Add one ({count})
          </Button>
          <CopyToClipboard text={() => `Count: ${count}`} onCopy={setLast}>
            <Button>Copy the count</Button>
          </CopyToClipboard>
        </Stack>
        <Text variant="p3" tone="muted">
          Last copied: {last}
        </Text>
      </Stack>
    )
  },
}

/**
 * Its child gets `data-copy-status` (`copied` or `failed`) for as long as the
 * status lasts, so CSS can style the moment after a copy.
 */
export const StyledByStatus: Story = {
  render: () => (
    <>
      <CopyToClipboard text="#7c3aed">
        <Button variant="outline" className="copy-demo">
          Copy #7c3aed
        </Button>
      </CopyToClipboard>
      <style>{`.copy-demo[data-copy-status='copied'] { border-color: var(--greese-color-positive); color: var(--greese-color-positive); }`}</style>
    </>
  ),
}
