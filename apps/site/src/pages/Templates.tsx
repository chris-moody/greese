import { lazy, Suspense, useMemo, type CSSProperties, type JSX } from 'react'
import {
  Button,
  Card,
  Container,
  Grid,
  Heading,
  Link,
  Spinner,
  Stack,
  Text,
} from '@greese/react'
import { ArrowRightIcon, ChevronLeftIcon, GithubIcon } from '@greese/icons'
import { REPO_URL } from '../config.ts'
import { useShell } from '../shell.ts'
import { RouteLink, useSubpage } from '../router.tsx'
import { TEMPLATES, type TemplateEntry } from '../templates/index.ts'
import '../templates/templates.scss'

const sourceUrl = (t: TemplateEntry) => `${REPO_URL}/blob/main/apps/site/src/templates/${t.file}`

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
          Six pages made only of GreeseUI components. Each wears the theme you pick in the
          header, shapes included, and works on a phone. Copy the source, or ask an assistant
          for it through @greese/mcp.
        </Text>
      </Stack>
      <Grid container minChildWidth="18rem" gap={4}>
        {TEMPLATES.map((t) => (
          <Card key={t.id} variant="outline" interactive asChild>
            <RouteLink to="templates" page={t.id}>
              <div
                className="tpl-art"
                style={{ '--tpl-hue': t.hue } as CSSProperties}
                aria-hidden="true"
              />
              <Heading level={2} variant="h5">
                {t.title}
              </Heading>
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

const TemplateView = ({ template }: { template: TemplateEntry }): JSX.Element => {
  const Page = useMemo(() => lazy(() => template.load().then((c) => ({ default: c }))), [template])
  // "Replay motion" remounts the page, so every entrance plays again.
  const { replay } = useShell()
  return (
    <div id="main">
      <div className="tpl-bar">
        <Button asChild size="sm" variant="ghost" tone="neutral" startIcon={<ChevronLeftIcon />}>
          <RouteLink to="templates">Templates</RouteLink>
        </Button>
        <Text variant="p3" weight="semibold">
          {template.title}
        </Text>
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
        <Page key={replay} />
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
