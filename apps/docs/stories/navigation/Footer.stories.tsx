import type { Meta, StoryObj } from '@storybook/react-vite'
import { Footer, FooterSection, Link, Stack, Text } from '@greese/react'

const meta = {
  title: 'Navigation/Footer',
  component: Footer,
  subcomponents: { FooterSection },
  parameters: { layout: 'fullscreen' },
  args: {
    brand: (
      <Stack gap={2}>
        <Text weight="bold">Acme</Text>
        <Text variant="p3" tone="muted">
          Light, native components for teams that ship every week.
        </Text>
      </Stack>
    ),
    legal: (
      <>
        <span>© 2026 Acme, Inc.</span>
        <Stack direction="row" gap={4}>
          <Link href="#privacy" tone="neutral">
            Privacy
          </Link>
          <Link href="#terms" tone="neutral">
            Terms
          </Link>
        </Stack>
      </>
    ),
    children: (
      <>
        <FooterSection title="Product">
          <Link href="#features" tone="neutral">
            Features
          </Link>
          <Link href="#pricing" tone="neutral">
            Pricing
          </Link>
          <Link href="#changelog" tone="neutral">
            Changelog
          </Link>
        </FooterSection>
        <FooterSection title="Developers">
          <Link href="#docs" tone="neutral">
            Docs
          </Link>
          <Link href="#api" tone="neutral">
            API
          </Link>
        </FooterSection>
        <FooterSection title="Company">
          <Link href="#about" tone="neutral">
            About
          </Link>
          <Link href="#careers" tone="neutral">
            Careers
          </Link>
        </FooterSection>
      </>
    ),
  },
} satisfies Meta<typeof Footer>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Only the closing row, for a page that needs little more. */
export const LegalOnly: Story = { args: { brand: undefined, children: undefined } }
