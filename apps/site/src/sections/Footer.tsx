import '../styles/library.ts'
import type { JSX } from 'react'
import { Footer as Base, FooterSection, Link, Stack, Text } from '@greese/react'
import { REPO_URL } from '../config.ts'
import { RouteLink } from '../router.tsx'

export const Footer = (): JSX.Element => (
  <Base
    className="site-footer"
    greese={{ inView: 'theme', stagger: 0.06 }}
    brand={
      <Stack gap={2}>
        <Text weight="bold">greese</Text>
        <Text tone="muted" variant="p3">
          GreeseUI and greese.js. Built with GreeseUI.
        </Text>
      </Stack>
    }
    legal={
      <>
        <span>MIT licensed.</span>
        <Link href="#top" tone="neutral" greese={{ hover: 'rise' }}>
          Back to top
        </Link>
      </>
    }
  >
    <FooterSection title="Make">
      <Link asChild tone="neutral" greese={{ hover: 'rise' }}>
        <RouteLink to="studio">Theme Studio</RouteLink>
      </Link>
      <Link asChild tone="neutral" greese={{ hover: 'rise' }}>
        <RouteLink to="templates">Templates</RouteLink>
      </Link>
    </FooterSection>
    <FooterSection title="Learn">
      <Link asChild tone="neutral" greese={{ hover: 'rise' }}>
        <RouteLink to="docs">Docs</RouteLink>
      </Link>
      <Link href={REPO_URL} tone="neutral" greese={{ hover: 'rise' }}>
        GitHub
      </Link>
    </FooterSection>
  </Base>
)
