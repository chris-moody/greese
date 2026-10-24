import type { JSX } from 'react'
import {
  Accordion,
  AccordionItem,
  Card,
  CardMedia,
  Heading,
  Image,
  Skeleton,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from '@greese/react'
import '@greese/react/base.css'
import '@greese/react/styles.css'

const pixel =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 1"/%3E'

const ExampleTabs = ({ id }: { id: string }) => (
  <Tabs defaultValue="a" data-testid={id}>
    <TabList aria-label={`Tabs ${id}`}>
      <Tab value="a">Alpha</Tab>
      <Tab value="b">Beta</Tab>
      <Tab value="c">Gamma</Tab>
    </TabList>
    <TabPanel value="a">Panel A</TabPanel>
    <TabPanel value="b">Panel B</TabPanel>
    <TabPanel value="c">Panel C</TabPanel>
  </Tabs>
)

/** Content and disclosure fixtures for e2e/content.spec.ts. */
export const Content = (): JSX.Element => (
  <main style={{ padding: '1rem', maxInlineSize: '40rem' }}>
    <Stack gap={6}>
      <Heading level={1} data-testid="h1">
        Heading one
      </Heading>
      <Text data-testid="clamped" truncate={2} style={{ inlineSize: '12rem' }}>
        A long paragraph that keeps going well past two lines so the clamp has something
        to cut off at the end of the second line.
      </Text>

      <Accordion exclusive data-testid="accordion">
        <AccordionItem title="Shipping">Ships in two days.</AccordionItem>
        <AccordionItem title="Returns">Free returns for 30 days.</AccordionItem>
      </Accordion>

      <ExampleTabs id="ltr" />
      <div dir="rtl">
        <ExampleTabs id="rtl" />
      </div>

      <Card data-testid="card" style={{ inlineSize: '20rem' }}>
        <CardMedia data-testid="card-media">
          <Image alt="" src={pixel} ratio={2} placeholder="#ddd" />
        </CardMedia>
        <Text>Card body</Text>
      </Card>
      <Card asChild interactive data-testid="card-link" style={{ inlineSize: '20rem' }}>
        <a href="#card">
          <CardMedia data-testid="card-link-media">
            <Image alt="" src={pixel} ratio={2} placeholder="#ddd" />
          </CardMedia>
          <Text>A card that is a link</Text>
        </a>
      </Card>

      <Image data-testid="hero" alt="Hero" src={pixel} priority />
      <Skeleton data-testid="skeleton" />
      <Spinner data-testid="spinner" />
    </Stack>
  </main>
)
