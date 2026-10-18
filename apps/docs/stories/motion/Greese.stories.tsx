import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge, Card, Heading, Stack, splitText, Text, timeline } from '@greese-ui/react'
import { Player } from './Player.tsx'

const meta = {
  title: 'Motion/greese.js',
  parameters: { layout: 'padded' },
} satisfies Meta
export default meta

type Story = StoryObj

const box = {
  inlineSize: '3rem',
  blockSize: '3rem',
  borderRadius: 'var(--greese-radius-md)',
}

/** `to` and `from` in sequence, with positions, stagger and eases. */
export const Sequence: Story = {
  render: () => (
    <Player
      build={(root) =>
        timeline()
          .from(root.querySelectorAll('.tile'), {
            opacity: 0,
            y: 24,
            scale: 0.8,
            duration: 0.5,
            ease: 'back.out(2)',
            stagger: 0.08,
          })
          .to(
            root.querySelectorAll('.tile'),
            { rotate: 90, duration: 0.6, ease: 'power3.inOut' },
            '+=0.2'
          )
          .to(
            root.querySelectorAll('.tile'),
            { x: 40, duration: 0.4, stagger: { each: 0.06, from: 'end' } },
            '<0.3'
          )
      }
    >
      <Stack direction="row" gap={3}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="tile"
            style={{ ...box, background: 'var(--greese-color-accent)' }}
          />
        ))}
      </Stack>
    </Player>
  ),
}

/** Keyframes with offsets and per-frame eases; colours mix in OKLab. */
export const Keyframes: Story = {
  render: () => (
    <Player
      build={(root) =>
        timeline({ repeat: 1, yoyo: true }).animate(
          root.querySelector('.pulse'),
          [
            { scale: 1, backgroundColor: '#3b82f6', ease: 'out' },
            { scale: 1.4, backgroundColor: '#e11d48', offset: 0.3, ease: 'in' },
            { scale: 1, backgroundColor: '#22c55e' },
          ],
          { duration: 1.2 }
        )
      }
    >
      <div
        className="pulse"
        style={{ ...box, background: '#3b82f6', marginInline: '2rem' }}
      />
    </Player>
  ),
}

/** Timelines inside timelines, each with its own repeat and time scale. */
export const Nesting: Story = {
  render: () => (
    <Player
      build={(root) => {
        const spin = timeline({ repeat: 2 }).to(root.querySelector('.spin'), {
          rotate: 360,
          duration: 0.6,
          ease: 'linear',
        })
        const slide = timeline({ yoyo: true, repeat: 1 }).to(
          root.querySelector('.slide'),
          {
            x: 160,
            duration: 0.8,
          }
        )
        return timeline().add(spin).add(slide.timeScale(2), '<0.3')
      }}
    >
      <Stack gap={3}>
        <div
          className="spin"
          style={{ ...box, background: 'var(--greese-color-warning)' }}
        />
        <div
          className="slide"
          style={{ ...box, background: 'var(--greese-color-positive)' }}
        />
      </Stack>
    </Player>
  ),
}

/** `splitText` for per-character motion, and text that counts. */
export const Text_: Story = {
  name: 'Text',
  render: () => (
    <Player
      build={(root) => {
        const { elements } = splitText(root.querySelector('h2')!)
        return timeline()
          .from(elements, {
            opacity: 0,
            y: 12,
            rotate: -10,
            duration: 0.4,
            stagger: 0.03,
          })
          .to(
            root.querySelector('.count'),
            { text: '12480', duration: 1.2, ease: 'out' },
            '<'
          )
      }}
    >
      <Stack gap={2}>
        <Heading level={2}>Greese, served fast</Heading>
        <Text size="xl" weight="bold">
          <span className="count">0</span> orders
        </Text>
      </Stack>
    </Player>
  ),
}

/**
 * Tokens drive components, so animating a token restyles everything that
 * reads it: here the accent, which the badge and card border follow.
 */
export const AnimatingTokens: Story = {
  render: () => (
    <Player
      build={(root) =>
        timeline({ repeat: 1, yoyo: true }).to(root.querySelector('.themed'), {
          '--greese-color-accent': '#e11d48',
          '--greese-radius-lg': '2rem',
          duration: 1,
          ease: 'inOut',
        })
      }
    >
      <div className="themed">
        <Card
          variant="outline"
          style={{ borderColor: 'var(--greese-color-accent)', maxInlineSize: '18rem' }}
        >
          <Stack gap={2} align="start">
            <Badge tone="accent" variant="solid">
              New
            </Badge>
            <Text>The accent and radius are animating.</Text>
          </Stack>
        </Card>
      </div>
    </Player>
  ),
}
