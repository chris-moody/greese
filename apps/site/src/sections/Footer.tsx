import type { JSX } from 'react'
import { Container, Divider, Link, Stack, Text } from '@greese-ui/react'
import { DOCS_URL, REPO_URL, STUDIO_URL } from '../config.ts'
import { facts } from '../data/index.ts'

export const Footer = (): JSX.Element => (
  <footer className="site-footer">
    <Container size="lg">
      <Stack gap={5}>
        <Divider greese={{ inView: 'growX' }} className="site-grow" />
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justify="between"
          gap={4}
          greese={{ inView: 'fadeUp', stagger: 0.06 }}
        >
          <Text tone="muted" size="sm">
            GreeseUI and greese.js. Built with GreeseUI; every number on this page was
            measured from the repository on {facts.date}.
          </Text>
          <Stack direction="row" gap={4}>
            <Link href={DOCS_URL} tone="neutral" greese={{ hover: 'float' }}>
              Docs
            </Link>
            <Link href={STUDIO_URL} tone="neutral" greese={{ hover: 'float' }}>
              Theme Studio
            </Link>
            <Link href={REPO_URL} tone="neutral" greese={{ hover: 'float' }}>
              GitHub
            </Link>
            <Link href="#top" tone="neutral" greese={{ hover: 'float' }}>
              Back to top
            </Link>
          </Stack>
        </Stack>
      </Stack>
    </Container>
  </footer>
)
