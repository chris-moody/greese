import type { Meta, StoryObj } from '@storybook/react-vite'
import { AspectRatio, Box } from '@greese-ui/react'
import { art } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Layout/AspectRatio',
  component: AspectRatio,
  args: { ratio: { xs: 1, md: 16 / 9 } },
  render: (args) => (
    <Box maxW="32rem">
      <AspectRatio {...args} style={{ borderRadius: 'var(--greese-radius-lg)' }}>
        <img alt="" src={art(210)} />
      </AspectRatio>
    </Box>
  ),
} satisfies Meta<typeof AspectRatio>
export default meta

type Story = StoryObj<typeof meta>

/** Square on phones, 16:9 from md. Space is reserved before media loads. */
export const Responsive: Story = {}

/** `fit="contain"` letterboxes instead of cropping. */
export const Contain: Story = { args: { ratio: 1, fit: 'contain' } }
