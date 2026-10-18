import type { CSSProperties, JSX, ReactNode } from 'react'
import {
  AspectRatio,
  Box,
  Container,
  Grid,
  GridItem,
  Hide,
  Show,
  Spacer,
  Stack,
} from '@greese-ui/react'
import '@greese-ui/react/base.css'
import '@greese-ui/react/styles.css'

const cell: CSSProperties = {
  minBlockSize: '1rem',
  background: 'var(--greese-color-surface)',
}
const C = ({ id }: { id?: string }) => <div data-testid={id} style={cell} />

const Fixture = ({ name, children }: { name: string; children: ReactNode }) => (
  <section aria-label={name} style={{ marginBlockEnd: '1rem' }}>
    {children}
  </section>
)

/** Layout fixtures for e2e/layout.spec.ts, asserted at every breakpoint width. */
export const Layout = (): JSX.Element => (
  <main>
    <Fixture name="stack-responsive">
      <Stack
        data-testid="stack-responsive"
        direction={{ xs: 'column', md: 'row' }}
        gap={{ xs: 2, lg: '13px' }}
      >
        <C />
        <C />
      </Stack>
    </Fixture>

    <Fixture name="stack-nested">
      <Stack data-testid="outer" gap={{ md: 6 }}>
        <Stack data-testid="inner-gap" gap={1}>
          <C />
          <C />
        </Stack>
        <Stack data-testid="inner-plain">
          <C />
          <C />
        </Stack>
      </Stack>
    </Fixture>

    <Fixture name="stack-md-only">
      <Stack data-testid="stack-md-only" direction={{ md: 'row' }}>
        <C />
      </Stack>
    </Fixture>

    <Fixture name="box">
      <Box
        data-testid="box"
        p={{ xs: 2, md: 6 }}
        mx="auto"
        maxW="20rem"
        display={{ xs: 'none', sm: 'block' }}
      />
      <Container data-testid="box-partial" size="sm" mt={4}>
        <C />
      </Container>
    </Fixture>

    <Fixture name="grid">
      <Grid data-testid="grid-columns" columns={{ xs: 1, sm: 2, lg: 4 }} gap={2}>
        <C />
        <C />
        <C />
        <C />
      </Grid>
      <Grid data-testid="grid-min" minChildWidth="200px" gap={2}>
        <C />
        <C />
        <C />
        <C />
        <C />
        <C />
      </Grid>
      <div style={{ inlineSize: '400px' }}>
        <Grid data-testid="grid-container" columns={12} container>
          <GridItem data-testid="item-in-container" span={{ xs: 12, md: 6 }}>
            <C />
          </GridItem>
        </Grid>
        <Grid data-testid="grid-viewport" columns={12}>
          <GridItem data-testid="item-in-viewport" span={{ xs: 12, md: 6 }}>
            <C />
          </GridItem>
        </Grid>
      </div>
    </Fixture>

    <Fixture name="visibility">
      <Show above="md">
        <span data-testid="show-above-md">show above md</span>
      </Show>
      <Hide above="md">
        <span data-testid="hide-above-md">hide above md</span>
      </Hide>
      <Show above="sm" below="lg" asChild>
        <span data-testid="show-sm-to-lg">sm to lg</span>
      </Show>
      <Hide above="sm" below="lg" asChild>
        <span data-testid="hide-sm-to-lg">not sm to lg</span>
      </Hide>
    </Fixture>

    <Fixture name="container">
      <Container data-testid="container" size="sm">
        <C />
      </Container>
      <Container data-testid="container-px" px={2}>
        <C />
      </Container>
    </Fixture>

    <Fixture name="media">
      <div style={{ inlineSize: '200px' }}>
        <AspectRatio data-testid="aspect" ratio={{ xs: 1, md: 2 }}>
          <img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
        </AspectRatio>
      </div>
      <Stack data-testid="spacer-row" direction="row" style={{ inlineSize: '300px' }}>
        <C id="spacer-first" />
        <Spacer />
        <div data-testid="spacer-last" style={{ ...cell, inlineSize: '50px' }} />
      </Stack>
    </Fixture>
  </main>
)
