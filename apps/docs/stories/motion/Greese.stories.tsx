import { useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Badge,
  Card,
  Heading,
  Link,
  Stack,
  splitText,
  Text,
  timeline,
} from '@greese/react'
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
        timeline({ scope: root })
          .from('.tile', {
            opacity: 0,
            y: 24,
            scale: 0.8,
            duration: 0.5,
            ease: 'back.out(2)',
            stagger: 0.08,
          })
          .to('.tile', { rotate: 90, duration: 0.6, ease: 'power3.inOut' }, '+=0.2')
          .to(
            '.tile',
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
            style={{ ...box, background: 'var(--greese-color-primary)' }}
          />
        ))}
      </Stack>
    </Player>
  ),
}

/** Keyframes with offsets and per-frame eases; colors mix in OKLab. */
export const Keyframes: Story = {
  render: () => (
    <Player
      build={(root) =>
        timeline({ repeat: 1, yoyo: true, scope: root }).animate(
          '.pulse',
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
        const spin = timeline({ repeat: 2, scope: root }).to('.spin', {
          rotate: 360,
          duration: 0.6,
          ease: 'linear',
        })
        const slide = timeline({ yoyo: true, repeat: 1, scope: root }).to('.slide', {
          x: 160,
          duration: 0.8,
        })
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
  render: function TextStory() {
    const heading = useRef<HTMLHeadingElement>(null)
    return (
      <Player
        build={(root) => {
          const { elements } = splitText(heading.current!)
          return timeline({ scope: root })
            .from(elements, {
              opacity: 0,
              y: 12,
              rotate: -10,
              duration: 0.4,
              stagger: 0.03,
            })
            .to('.count', { text: '12480', duration: 1.2, ease: 'out' }, '<')
        }}
      >
        <Stack gap={2}>
          <Heading ref={heading} level={2}>
            Greese, served fast
          </Heading>
          <Text variant="s1" weight="bold">
            <span className="count">0</span> orders
          </Text>
        </Stack>
      </Player>
    )
  },
}

/**
 * Text inside markup: `splitText` splits each text node where it is, and
 * `text` types into the text nodes in reading order, so the link and the
 * emphasis stay what they are as the words arrive.
 */
export const TextInMarkup: Story = {
  render: function TextInMarkupStory() {
    const heading = useRef<HTMLHeadingElement>(null)
    const line = useRef<HTMLElement>(null)
    return (
      <Player
        build={() => {
          const { elements } = splitText(heading.current!, { by: 'words' })
          return timeline()
            .from(elements, { opacity: 0, y: 12, duration: 0.4, stagger: 0.08 })
            .fromTo(
              line.current,
              { text: '' },
              { text: line.current!.textContent, duration: 1.6, ease: 'linear' },
              '-=0.2'
            )
        }}
      >
        <Stack gap={2}>
          <Heading ref={heading} level={2}>
            Read <Link href="#greese-js">the docs</Link>, <em>then</em> ship
          </Heading>
          <Text ref={line}>
            Typed with <strong>bold</strong>, <em>emphasis</em> and{' '}
            <Link href="#greese-js">a link</Link> kept.
          </Text>
        </Stack>
      </Player>
    )
  },
}

/**
 * Tokens drive components, so animating a token restyles everything that
 * reads it: here the primary color, which the badge and card border follow.
 */
export const AnimatingTokens: Story = {
  render: () => (
    <Player
      build={(root) =>
        timeline({ repeat: 1, yoyo: true, scope: root }).to('.themed', {
          '--greese-color-primary': '#e11d48',
          '--greese-radius-lg': '2rem',
          duration: 1,
          ease: 'inOut',
        })
      }
    >
      <div className="themed">
        <Card
          variant="outline"
          style={{ borderColor: 'var(--greese-color-primary)', maxInlineSize: '18rem' }}
        >
          <Stack gap={2} align="start">
            <Badge tone="primary" variant="solid">
              New
            </Badge>
            <Text>The primary color and radius are animating.</Text>
          </Stack>
        </Card>
      </div>
    </Player>
  ),
}
