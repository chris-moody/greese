import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, ChatBubble, Stack } from '@greese-ui/react'

const meta = {
  title: 'Content/ChatBubble',
  component: ChatBubble,
  args: {
    author: 'Ada Lovelace',
    time: '09:12',
    avatar: <Avatar name="Ada Lovelace" size="sm" />,
    children: 'Did the build pass?',
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['start', 'end'] },
    tone: {
      control: 'select',
      options: [
        'neutral',
        'primary',
        'secondary',
        'tertiary',
        'accent',
        'positive',
        'negative',
        'warning',
        'info',
      ],
    },
  },
} satisfies Meta<typeof ChatBubble>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** A conversation in a `role="log"`, so new messages are announced. */
export const Conversation: Story = {
  render: () => (
    <Stack role="log" aria-label="Messages" gap={3} style={{ maxInlineSize: '32rem' }}>
      <ChatBubble
        author="Ada"
        time="09:12"
        avatar={<Avatar name="Ada Lovelace" size="sm" />}
      >
        Did the build pass?
      </ChatBubble>
      <ChatBubble side="end" time="09:13" footer="Seen">
        All green. Shipping it now.
      </ChatBubble>
      <ChatBubble
        author="Ada"
        time="09:14"
        avatar={<Avatar name="Ada Lovelace" size="sm" />}
      >
        Lovely, thank you!
      </ChatBubble>
      <ChatBubble side="end" tone="negative" footer="Failed to send">
        One more thing…
      </ChatBubble>
    </Stack>
  ),
}
