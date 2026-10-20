import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heading, TextRotate } from '@greese/react'

const meta = {
  title: 'Motion/TextRotate',
  component: TextRotate,
  args: { items: ['faster', 'smaller', 'lighter'] },
  argTypes: { duration: { control: { type: 'number', min: 0.5, step: 0.5 } } },
  render: (args) => (
    <Heading level={2} size="3xl">
      Build <TextRotate {...args} style={{ color: 'var(--greese-color-primary)' }} />
    </Heading>
  ),
} satisfies Meta<typeof TextRotate>
export default meta

type Story = StoryObj<typeof meta>

/** CSS only. Under reduced motion the first word stays. */
export const Playground: Story = {}

export const Slower: Story = {
  args: { items: ['design', 'build', 'ship', 'repeat'], duration: 4 },
}
