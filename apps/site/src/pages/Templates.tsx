import '../styles/library.ts'
import {
  createElement,
  Suspense,
  use,
  type ComponentType,
  type CSSProperties,
  type JSX,
} from 'react'
import {
  Button,
  Card,
  Container,
  Grid,
  Heading,
  Link,
  PageShare,
  Spinner,
  Stack,
  Text,
} from '@greese/react'
import { ArrowRightIcon, ChevronLeftIcon, GithubIcon } from '@greese/icons'
import { REPO_URL } from '../config.ts'
import { useShell } from '../shell.ts'
import { RouteLink, useSubpage } from '../router.tsx'
import { TEMPLATES, type TemplateEntry } from '../templates/index.ts'
import { once } from './chunks.ts'
import '../templates/templates.scss'

// Each template's screenshots, light and dark (`npm run shots -w site`).
const SHOTS = import.meta.glob<string>('../templates/shots/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})
const shot = (id: string, scheme: 'light' | 'dark') =>
  SHOTS[`../templates/shots/${id}-${scheme}.webp`]

const sourceUrl = (t: TemplateEntry) =>
  `${REPO_URL}/blob/main/apps/site/src/templates/${t.file}`

const Gallery = (): JSX.Element => (
  <Container size="lg">
    <Stack gap={6} py={{ xs: 5, md: 7 }} id="main">
      <Stack gap={3}>
        <Text variant="caption" tone="muted" className="tpl-kicker">
          Templates
        </Text>
        <Heading level={1} variant="h1">
          Start from a whole page
        </Heading>
        <Text tone="muted" className="tpl-measure">
          Six pages made only of greese ui components. Each wears the theme you pick in
          the header, shapes included, and works on a phone. Copy the source, or ask an
          assistant for it through @greese/mcp.
        </Text>
      </Stack>
      <Grid container minChildWidth="18rem" gap={4}>
        {TEMPLATES.map((t) => (
          <Card key={t.id} variant="outline" interactive asChild>
            <RouteLink to="templates" page={t.id}>
              {/* The page itself, in the scheme being worn; the card's title
                  names it, so the picture is left unnamed. */}
              <div
                className="tpl-art tpl-shot-frame"
                style={{ '--tpl-hue': t.hue } as CSSProperties}
              >
                {(['light', 'dark'] as const).map(
                  (scheme) =>
                    shot(t.id, scheme) && (
                      <img
                        key={scheme}
                        src={shot(t.id, scheme)}
                        alt=""
                        width={800}
                        height={450}
                        loading="lazy"
                        decoding="async"
                        className={`tpl-shot tpl-shot--${scheme}`}
                      />
                    )
                )}
              </div>
              {/* Morphs into the template's title in the bar on its page (ADR 0029). */}
              <PageShare id={['template', t.id]}>
                <Heading level={2} variant="h5">
                  {t.title}
                </Heading>
              </PageShare>
              <Text variant="p3" tone="muted">
                {t.summary}
              </Text>
              <Text variant="p3" weight="semibold" tone="primary" className="tpl-open">
                Open <ArrowRightIcon />
              </Text>
            </RouteLink>
          </Card>
        ))}
      </Grid>
    </Stack>
  </Container>
)

/** Each template's page, fetched once: the view's and a page change's (`preloadTemplate`). */
const loaders = new Map<string, () => Promise<ComponentType>>()
const loadTemplate = (template: TemplateEntry) => {
  let load = loaders.get(template.id)
  if (!load) loaders.set(template.id, (load = once(template.load)))
  return load()
}

/** A template's page, once it's loaded. */
const TemplatePage = ({ template }: { template: TemplateEntry }): JSX.Element =>
  createElement(use(loadTemplate(template)))

/** Fetches a template's page, for a page change to wait on (pages/chunks.ts). */
export const preloadTemplate = (id: string): Promise<unknown> | undefined => {
  const template = TEMPLATES.find((t) => t.id === id)
  return template && loadTemplate(template)
}

const TemplateView = ({ template }: { template: TemplateEntry }): JSX.Element => {
  // "Replay motion" remounts the page, so every entrance plays again.
  const { replay } = useShell()
  return (
    <div id="main">
      <div className="tpl-bar">
        <Button
          asChild
          size="sm"
          variant="ghost"
          tone="neutral"
          startIcon={<ChevronLeftIcon />}
        >
          <RouteLink to="templates">Templates</RouteLink>
        </Button>
        <PageShare id={['template', template.id]}>
          <Text variant="p3" weight="semibold">
            {template.title}
          </Text>
        </PageShare>
        <Link href={sourceUrl(template)} underline="hover" className="tpl-source">
          <GithubIcon /> Source
        </Link>
      </div>
      <Suspense
        fallback={
          <Stack align="center" p={8}>
            <Spinner label="Loading the template" />
          </Stack>
        }
      >
        <TemplatePage key={replay} template={template} />
      </Suspense>
    </div>
  )
}

/** `/templates`: the gallery; `/templates/<id>`: one template, under a bar back to it. */
export const Templates = (): JSX.Element => {
  const id = useSubpage()
  const template = TEMPLATES.find((t) => t.id === id)
  const { replay } = useShell()
  return template ? <TemplateView template={template} /> : <Gallery key={replay} />
}
