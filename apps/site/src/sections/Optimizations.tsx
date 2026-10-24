import type { JSX } from 'react'
import { Accordion, AccordionItem, Code, Stack, Text } from '@greese/react'
import { facts, kB } from '../data/index.ts'
import { Section } from '../Section.tsx'

const items: Array<{ title: string; body: JSX.Element }> = [
  {
    title: 'CSS compiled once, not computed per render',
    body: (
      <>
        Components render class names and, for arbitrary values, inline custom properties.
        Media queries live in the stylesheet, never in JavaScript, so there is nothing to
        recompute on resize and nothing to hydrate. Every rule sits in{' '}
        <Code>@layer greese.*</Code>, so your own CSS wins without <Code>!important</Code>
        .
      </>
    ),
  },
  {
    title: 'Ship only the CSS you use',
    body: (
      <>
        Import <Code>styles.css</Code> ({kB(facts.css.size)} brotli) for everything, or
        per-component stylesheets such as <Code>css/Button.css</Code>. Each pulls in the
        shared core once, and bundlers de-duplicate the rest.
      </>
    ),
  },
  {
    title: 'Animation that loads only when needed',
    body: (
      <>
        Entrance presets are CSS classes. Anything that needs JavaScript (scroll reveals,
        hover, text effects, sequences) loads a {kB(facts.runtime.size)} runtime as its
        own chunk, the first time a prop asks for it. A page of plain Buttons never
        downloads greese.js.
      </>
    ),
  },
  {
    title: 'Native elements first',
    body: (
      <>
        Dialogs are <Code>&lt;dialog&gt;</Code>, menus and tooltips use the Popover API
        with CSS anchor positioning, accordions are <Code>&lt;details&gt;</Code>, and form
        controls are the real inputs. No positioning library and no focus-trap package:
        the browser already has them.
      </>
    ),
  },
  {
    title: 'Server Components by default',
    body: (
      <>
        Layout and text components carry no <Code>{"'use client'"}</Code>. Their
        animations still render on the server as classes, so the first paint is already
        moving.
      </>
    ),
  },
  {
    title: 'Gates on every change',
    body: (
      <>
        Size budgets, Lighthouse (performance, accessibility and best practices at 0.95 or
        better), visual snapshots in light and dark on phone and desktop, and end-to-end
        tests in Chromium, Firefox, WebKit, a Pixel 7 and an iPhone.
      </>
    ),
  },
]

export const Optimizations = (): JSX.Element => (
  <Section
    id="optimizations"
    eyebrow="Optimizations"
    title="Fast because there’s less to do"
    intro="Most of the speed comes from work GreeseUI doesn’t do at runtime."
    tinted
  >
    <Accordion greese={{ inView: 'theme', stagger: 0.06 }}>
      {items.map((item, i) => (
        <AccordionItem key={item.title} title={item.title} defaultOpen={i === 0}>
          <Stack gap={2}>
            <Text tone="muted" greese={{ enter: 'theme' }}>
              {item.body}
            </Text>
          </Stack>
        </AccordionItem>
      ))}
    </Accordion>
  </Section>
)
