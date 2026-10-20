import type { JSX, ReactNode } from 'react'
import { Container, Heading, Stack, Text } from '@greese/react'

interface SectionProps {
  id: string
  /** A short label above the heading. */
  eyebrow: string
  title: ReactNode
  intro?: ReactNode
  children: ReactNode
  /** The alternate background, to separate neighbouring sections. */
  tinted?: boolean
}

/** One page section: an anchor, a heading block that reveals on scroll, then content. */
export const Section = ({
  id,
  eyebrow,
  title,
  intro,
  children,
  tinted,
}: SectionProps): JSX.Element => (
  <section
    id={id}
    aria-labelledby={`${id}-title`}
    className={tinted ? 'site-section site-section--tinted' : 'site-section'}
  >
    <Container size="lg">
      <Stack gap={7}>
        <Stack
          gap={3}
          className="site-section-head"
          greese={{ inView: 'fadeUp', stagger: 0.08 }}
        >
          <Text variant="p3" weight="semibold" tone="primary" className="site-eyebrow">
            {eyebrow}
          </Text>
          <Heading id={`${id}-title`} level={2} variant="h2">
            {title}
          </Heading>
          {intro && (
            <Text variant="s2" tone="muted" className="site-measure">
              {intro}
            </Text>
          )}
        </Stack>
        {children}
      </Stack>
    </Container>
  </section>
)
