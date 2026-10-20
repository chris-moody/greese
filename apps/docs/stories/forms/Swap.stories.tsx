import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack, Swap } from '@greese/react'
import { MoonIcon, SunIcon } from '@greese/icons'

const meta = {
  title: 'Forms/Swap',
  component: Swap,
  args: { label: 'Dark mode', off: <SunIcon />, on: <MoonIcon /> },
  argTypes: { effect: { control: 'inline-radio', options: ['fade', 'rotate', 'flip'] } },
} satisfies Meta<typeof Swap>
export default meta

type Story = StoryObj<typeof meta>

/** Its name stays "Dark mode"; `aria-pressed` says whether it's on. */
export const Playground: Story = {}

export const Effects: Story = {
  render: () => (
    <Stack direction="row" gap={2}>
      <Swap label="Fade" off={<SunIcon />} on={<MoonIcon />} />
      <Swap
        label="Rotate"
        effect="rotate"
        off={<SunIcon />}
        on={<MoonIcon />}
        defaultPressed
      />
      <Swap label="Flip" effect="flip" off="👍" on="👎" />
    </Stack>
  ),
}
