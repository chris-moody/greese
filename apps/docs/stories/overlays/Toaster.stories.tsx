import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Stack, toast, Toaster } from '@greese-ui/react'

const meta = {
  title: 'Overlays/Toaster',
  component: Toaster,
  args: { max: 3 },
  render: (args) => (
    <>
      <Stack direction="row" gap={2} wrap="wrap">
        <Button
          onClick={() =>
            toast({
              title: 'Message archived',
              action: {
                label: 'Undo',
                onClick: () => toast({ title: 'Restored', tone: 'positive' }),
              },
            })
          }
        >
          Archive
        </Button>
        <Button
          variant="outline"
          tone="negative"
          onClick={() =>
            toast({
              title: "Couldn't save",
              description: 'Check your connection.',
              tone: 'negative',
            })
          }
        >
          Fail
        </Button>
        <Button
          variant="outline"
          tone="neutral"
          onClick={() => toast({ title: 'Stays until dismissed', duration: Infinity })}
        >
          Persistent
        </Button>
      </Stack>
      <Toaster {...args} />
    </>
  ),
} satisfies Meta<typeof Toaster>
export default meta

type Story = StoryObj<typeof meta>

/** Render one `<Toaster />`, then call `toast()` from anywhere. Hover or focus pauses auto-dismiss. */
export const Playground: Story = {}
