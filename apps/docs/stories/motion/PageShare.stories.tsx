import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type JSX } from 'react'
import {
  Button,
  Card,
  Heading,
  PageShare,
  PageTransition,
  Stack,
  Text,
  usePageNavigate,
} from '@greese/react'

const TEMPLATES = ['Finance', 'Travel', 'Health'] as const

/**
 * A gallery and a page, with a router of the story's own: the open template
 * is state. Each card and its page's hero share an id, so one morphs into
 * the other.
 */
const Gallery = (): JSX.Element => {
  const [open, setOpen] = useState<string>()
  const page = usePageNavigate((to) => {
    if (typeof to === 'string') setOpen(to.slice(1) || undefined)
  })
  // One URL: a navigation here is its own type, `story`, played as a page change.
  const go = (id = '') => page.navigate(`#${id}`, { types: ['story'] })
  return (
    <PageTransition types={{ story: {} }}>
      {open ? (
        <Stack gap={4}>
          <PageShare id={['template', open]}>
            <Card p={6}>
              <Heading level={2} variant="h2">
                {open}
              </Heading>
            </Card>
          </PageShare>
          <Text>The {open} template, opened.</Text>
          <Button variant="soft" onClick={() => go()}>
            All templates
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" gap={3}>
          {TEMPLATES.map((name) => (
            <PageShare key={name} id={['template', name]}>
              <Card p={4} interactive asChild>
                <button type="button" onClick={() => go(name)}>
                  {name}
                </button>
              </Card>
            </PageShare>
          ))}
        </Stack>
      )}
    </PageTransition>
  )
}

const meta = {
  title: 'Motion/PageShare',
  component: PageShare,
  args: { id: ['template', 'Finance'], children: null },
  parameters: { layout: 'padded' },
  render: () => <Gallery />,
} satisfies Meta<typeof PageShare>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Open a template: its card morphs into the page's hero, and back. Where the
 * browser has no view transitions, and under reduced motion, the page simply
 * changes.
 */
export const Playground: Story = {}
