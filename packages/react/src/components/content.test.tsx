import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../test/axe.ts'
import { functionProps } from '../test/serverProps.ts'
import { Accordion, AccordionItem } from './Accordion/Accordion.tsx'
import { Alert } from './Alert/Alert.tsx'
import { Avatar, initials } from './Avatar/Avatar.tsx'
import { AvatarGroup } from './Avatar/AvatarGroup.tsx'
import { Badge } from './Badge/Badge.tsx'
import { Button } from './Button/Button.tsx'
import { Card, CardMedia } from './Card/Card.tsx'
import { Chip } from './Chip/Chip.tsx'
import { Code } from './Code/Code.tsx'
import { Collapsible } from './Collapsible/Collapsible.tsx'
import { Heading } from './Heading/Heading.tsx'
import { Icon } from './Icon/Icon.tsx'
import { IconButton } from './IconButton/IconButton.tsx'
import { Image, isPlaceholderColor } from './Image/Image.tsx'
import { Link } from './Link/Link.tsx'
import { Embed, Video } from './Media/Media.tsx'
import { Progress } from './Progress/Progress.tsx'
import { Skeleton } from './Skeleton/Skeleton.tsx'
import { Spinner } from './Spinner/Spinner.tsx'
import { Tab, TabList, TabPanel, Tabs } from './Tabs/Tabs.tsx'
import { Text } from './Text/Text.tsx'
import { ToggleButton } from './ToggleButton/ToggleButton.tsx'

describe('typography', () => {
  it('Text is a paragraph with tone, weight and truncation', () => {
    render(
      <Text tone="muted" weight="semibold" truncate={2}>
        Body
      </Text>
    )
    const text = screen.getByText('Body')
    expect(text.tagName).toBe('P')
    expect(text).toHaveClass(
      'greese-Text--muted',
      'greese-Text--semibold',
      'greese-Text--clamp'
    )
    expect(text.style.getPropertyValue('--greese-text-lines')).toBe('2')
  })

  it('Text renders other elements with asChild', () => {
    render(
      <Text asChild truncate>
        <span>Inline</span>
      </Text>
    )
    expect(screen.getByText('Inline').tagName).toBe('SPAN')
    expect(screen.getByText('Inline')).toHaveClass('greese-Text--truncate')
  })

  it('Heading separates outline level from visual style', () => {
    render(
      <Heading level={1} variant="h4">
        Page
      </Heading>
    )
    const heading = screen.getByRole('heading', { level: 1, name: 'Page' })
    expect(heading).toHaveClass('greese-Heading', 'greese-Type--h4')
    expect(heading.tagName).toBe('H1')
  })

  it('Link styles anchors and router links alike', () => {
    render(
      <>
        <Link href="/a">Plain</Link>
        <Link asChild underline="hover" tone="neutral">
          <a href="/b">Routed</a>
        </Link>
      </>
    )
    expect(screen.getByRole('link', { name: 'Plain' })).toHaveClass(
      'greese-Link--primary'
    )
    expect(screen.getByRole('link', { name: 'Routed' })).toHaveClass(
      'greese-Link--neutral',
      'greese-Link--underline-hover'
    )
  })

  it('Code blocks are focusable so they can be scrolled by keyboard', () => {
    render(
      <>
        <Code>inline</Code>
        <Code block>block</Code>
      </>
    )
    expect(screen.getByText('inline').tagName).toBe('CODE')
    const pre = screen.getByText('block').parentElement!
    expect(pre.tagName).toBe('PRE')
    expect(pre).toHaveAttribute('tabindex', '0')
  })
})

describe('Card and media', () => {
  it('Card exposes padding to CardMedia and takes Box props', () => {
    render(
      <Card data-testid="card" variant="elevated" padding={{ xs: 3, md: 6 }} interactive>
        <CardMedia data-testid="media" />
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass(
      'greese-Box',
      'greese-Card--elevated',
      'greese-Card--interactive'
    )
    expect(card.style.getPropertyValue('--greese-card-padding-md')).toBe(
      'var(--greese-space-6)'
    )
    expect(screen.getByTestId('media')).toHaveClass('greese-CardMedia')
  })

  it('Image is lazy by default and eager at high priority for LCP', () => {
    render(
      <>
        <Image alt="lazy" src="a.jpg" />
        <Image alt="hero" src="b.jpg" priority />
      </>
    )
    expect(screen.getByAltText('lazy')).toHaveAttribute('loading', 'lazy')
    expect(screen.getByAltText('lazy')).toHaveAttribute('decoding', 'async')
    expect(screen.getByAltText('hero')).toHaveAttribute('loading', 'eager')
    expect(screen.getByAltText('hero')).toHaveAttribute('fetchpriority', 'high')
  })

  it('Image puts the placeholder behind the image, in CSS', () => {
    render(
      <>
        <Image
          alt="blur"
          src="a.jpg"
          placeholder="data:image/png;base64,AAA"
          ratio={16 / 9}
        />
        <Image alt="tint" src="b.jpg" placeholder="#eee" />
      </>
    )
    const blur = screen.getByAltText('blur').parentElement!
    expect(blur.style.backgroundImage).toContain('data:image/png;base64,AAA')
    expect(blur).toHaveClass('greese-Image--framed')
    expect(screen.getByAltText('tint').parentElement!.style.backgroundColor).toBe(
      'rgb(238, 238, 238)'
    )
    expect(isPlaceholderColor('oklch(0.9 0 0)')).toBe(true)
    expect(isPlaceholderColor('/img/tiny.jpg')).toBe(false)
  })

  it('Image swaps in its fallback when loading fails', () => {
    render(<Image alt="broken" src="x.jpg" fallback="No image" />)
    fireEvent.error(screen.getByAltText('broken'))
    expect(screen.getByText('No image')).toHaveClass('greese-Image--fallback')
  })

  it('Video, Embed and Icon have no axe violations', async () => {
    const { container } = render(
      <>
        <Video src="clip.mp4" aria-label="Product tour" />
        <Embed title="Demo" src="https://example.com/embed" />
        <Icon label="Search">
          <svg viewBox="0 0 1 1" />
        </Icon>
      </>
    )
    await expectNoAxeViolations(container)
  })

  it('Video plays inline on iOS; Embed lazy-loads and requires a title', () => {
    render(
      <>
        <Video data-testid="video" src="clip.mp4" />
        <Embed title="Demo" src="https://example.com/embed" />
      </>
    )
    const video = screen.getByTestId('video')
    expect(video).toHaveAttribute('playsinline')
    expect(video).toHaveAttribute('controls')
    expect(screen.getByTitle('Demo')).toHaveAttribute('loading', 'lazy')
  })

  it('Icon is decorative unless labelled', () => {
    render(
      <>
        <Icon data-testid="decorative">
          <svg />
        </Icon>
        <Icon label="Verified" size="2rem">
          <svg />
        </Icon>
      </>
    )
    expect(screen.getByTestId('decorative')).toHaveAttribute('aria-hidden', 'true')
    const named = screen.getByRole('img', { name: 'Verified' })
    expect(named.style.getPropertyValue('--greese-icon-size')).toBe('2rem')
  })
})

describe('Avatar', () => {
  it('derives initials', () => {
    expect(initials('Ada Lovelace')).toBe('AL')
    expect(initials('  grace  brewster murray hopper ')).toBe('GH')
    expect(initials('Prince')).toBe('P')
    expect(initials('')).toBe('')
  })

  it('shows the image, then initials if it fails, named either way', () => {
    render(<Avatar name="Ada Lovelace" src="ada.jpg" />)
    fireEvent.error(screen.getByRole('img', { name: 'Ada Lovelace' }))
    const fallback = screen.getByRole('img', { name: 'Ada Lovelace' })
    expect(fallback).toHaveTextContent('AL')
  })

  it('groups avatars and counts the overflow', () => {
    render(
      <AvatarGroup aria-label="Shared with" max={2}>
        <Avatar name="A B" />
        <Avatar name="C D" />
        <Avatar name="E F" />
        <Avatar name="G H" />
      </AvatarGroup>
    )
    const group = screen.getByRole('group', { name: 'Shared with' })
    expect(group.querySelectorAll('.greese-Avatar')).toHaveLength(3)
    expect(screen.getByRole('img', { name: '2 more' })).toHaveTextContent('+2')
  })

  it('groups as a Server Component: AvatarGroup hands no function on', () => {
    // Avatar stays a client component (its image fallback); the group isn't.
    const server = [AvatarGroup] as unknown as Parameters<typeof functionProps>[1]
    expect(
      functionProps(
        <AvatarGroup aria-label="Team" max={1}>
          <Avatar name="A B" />
          <Avatar name="C D" />
          <Avatar name="E F" />
        </AvatarGroup>,
        server
      )
    ).toEqual([])
  })

  it('shows the one left over instead of a "+1"', () => {
    render(
      <AvatarGroup aria-label="Team" max={2}>
        <Avatar name="A B" />
        <Avatar name="C D" />
        <Avatar name="E F" />
      </AvatarGroup>
    )
    const group = screen.getByRole('group', { name: 'Team' })
    expect(group.querySelectorAll('.greese-Avatar')).toHaveLength(3)
    expect(group.querySelector('.greese-Avatar--count')).toBeNull()
  })
})

describe('Collapsible and Accordion', () => {
  it('is a Server Component: an accordion hands no function to the DOM', () => {
    const server = [Accordion, AccordionItem, Collapsible] as unknown as Parameters<
      typeof functionProps
    >[1]
    expect(
      functionProps(
        <Accordion exclusive>
          <AccordionItem title="One">1</AccordionItem>
        </Accordion>,
        server
      )
    ).toEqual([])
  })

  it('shares its name with items in fragments and lists, not inside your own components', () => {
    const Wrapped = () => <AccordionItem title="Wrapped">w</AccordionItem>
    const { container } = render(
      <Accordion exclusive>
        <>
          <AccordionItem title="In a fragment">f</AccordionItem>
        </>
        {['A', 'B'].map((t) => (
          <AccordionItem key={t} title={t}>
            {t}
          </AccordionItem>
        ))}
        <Wrapped />
      </Accordion>
    )
    const names = [...container.querySelectorAll('details')].map((d) =>
      d.getAttribute('name')
    )
    expect(names.slice(0, 3).every((n) => n && n === names[0])).toBe(true)
    expect(names[3]).toBeNull()
  })

  it('hands no function to the DOM without onOpenChange, so a Server Component can render it', () => {
    const server = [Collapsible] as unknown as Parameters<typeof functionProps>[1]
    expect(
      functionProps(<Collapsible title="More">Details</Collapsible>, server)
    ).toEqual([])
  })

  it('is a native details/summary that reports toggles', () => {
    const onOpenChange = vi.fn()
    render(
      <Collapsible title="More" onOpenChange={onOpenChange}>
        Hidden content
      </Collapsible>
    )
    const details = screen.getByText('More').closest('details')!
    expect(details.open).toBe(false)
    details.open = true
    fireEvent(details, new Event('toggle'))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('exclusive accordions share a native details name; others do not', () => {
    render(
      <>
        <Accordion exclusive>
          <AccordionItem title="One">1</AccordionItem>
          <AccordionItem title="Two" defaultOpen>
            2
          </AccordionItem>
        </Accordion>
        <Accordion>
          <AccordionItem title="Free">3</AccordionItem>
        </Accordion>
      </>
    )
    const one = screen.getByText('One').closest('details')!
    const two = screen.getByText('Two').closest('details')!
    // jsdom lacks the .name property; real exclusivity is covered in e2e.
    expect(one.getAttribute('name')).toBeTruthy()
    expect(one.getAttribute('name')).toBe(two.getAttribute('name'))
    expect(two.open).toBe(true)
    expect(screen.getByText('Free').closest('details')).not.toHaveAttribute('name')
  })

  it('turns one icon by default, the library chevron unless given another', () => {
    const { container } = render(
      <>
        <Collapsible title="Default">x</Collapsible>
        <Collapsible title="Own" icon={<i data-testid="plus" />}>
          x
        </Collapsible>
        <Collapsible title="None" icon={null}>
          x
        </Collapsible>
      </>
    )
    const icons = container.querySelectorAll('.greese-Collapsible-icon')
    expect(icons).toHaveLength(2)
    expect(icons[0]).toHaveClass('greese-Collapsible-icon--rotate')
    expect(icons[0]!.querySelector('.greese-Collapsible-chevron')).not.toBeNull()
    expect(icons[1]).toContainElement(screen.getByTestId('plus'))
    expect(icons[0]).toHaveAttribute('aria-hidden', 'true')
  })

  it('swaps an icon per state, crossfading unless told how', () => {
    const { container } = render(
      <>
        <Collapsible title="A" icon="+" openIcon="−">
          x
        </Collapsible>
        <Collapsible title="B" icon="+" openIcon="−" iconTransition="none">
          x
        </Collapsible>
      </>
    )
    const [fade, none] = container.querySelectorAll('.greese-Collapsible-icon')
    expect(fade).toHaveClass('greese-Collapsible-icon--fade')
    expect(fade!.querySelector('.greese-Collapsible-closedIcon')).toHaveTextContent('+')
    expect(fade!.querySelector('.greese-Collapsible-openIcon')).toHaveTextContent('−')
    expect(none).toHaveClass('greese-Collapsible-icon--none')
  })

  it('gives every item of an accordion its icons, and lets an item keep its own', () => {
    const { container } = render(
      <Accordion icon="+" openIcon="−">
        <AccordionItem title="One">1</AccordionItem>
        <AccordionItem title="Two" icon="▸" openIcon={null} iconTransition="rotate">
          2
        </AccordionItem>
      </Accordion>
    )
    const [one, two] = container.querySelectorAll('.greese-Collapsible-icon')
    expect(one).toHaveClass('greese-Collapsible-icon--fade')
    expect(one).toHaveTextContent('+−')
    // An item's own `null` is no open icon: one icon, turning.
    expect(two).toHaveClass('greese-Collapsible-icon--rotate')
    expect(two!.querySelector('.greese-Collapsible-closedIcon')).toHaveTextContent('▸')
    expect(two!.querySelector('.greese-Collapsible-openIcon')).toBeNull()
  })

  it("never mixes an item's icon with the group's, or the group's transition with it", () => {
    const { container } = render(
      <Accordion icon="+" openIcon="−" iconTransition="fade">
        <AccordionItem title="One" icon="▸">
          1
        </AccordionItem>
        <AccordionItem title="Two" openIcon={null}>
          2
        </AccordionItem>
      </Accordion>
    )
    const [one, two] = container.querySelectorAll('.greese-Collapsible-icon')
    // Its own icon alone: no group minus to fade to, so it turns.
    expect(one).toHaveClass('greese-Collapsible-icon--rotate')
    expect(one).toHaveTextContent('▸')
    expect(one!.querySelector('.greese-Collapsible-openIcon')).toBeNull()
    // Its own set (no open icon): the default chevron, turning.
    expect(two).toHaveClass('greese-Collapsible-icon--rotate')
    expect(two!.querySelector('.greese-Collapsible-chevron')).not.toBeNull()
  })
})

describe('Tabs', () => {
  const Example = (props: {
    activation?: 'automatic' | 'manual'
    onValueChange?: (v: string) => void
  }) => (
    <Tabs defaultValue="a" {...props}>
      <TabList aria-label="Sections">
        <Tab value="a">Alpha</Tab>
        <Tab value="b">Beta</Tab>
        <Tab value="c" disabled>
          Gamma
        </Tab>
        <Tab value="d">Delta</Tab>
      </TabList>
      <TabPanel value="a">Panel A</TabPanel>
      <TabPanel value="b">Panel B</TabPanel>
      <TabPanel value="d">Panel D</TabPanel>
    </Tabs>
  )

  it('wires tabs to panels and keeps one tab stop', () => {
    render(<Example />)
    const alpha = screen.getByRole('tab', { name: 'Alpha' })
    expect(alpha).toHaveAttribute('aria-selected', 'true')
    expect(alpha).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('tabindex', '-1')
    const panel = screen.getByRole('tabpanel', { name: 'Alpha' })
    expect(panel).toHaveTextContent('Panel A')
    expect(alpha).toHaveAttribute('aria-controls', panel.id)
    expect(screen.getByText('Panel B')).not.toBeVisible()
  })

  it('moves with arrows (skipping disabled tabs), wraps, and jumps with Home/End', async () => {
    const onValueChange = vi.fn()
    render(<Example onValueChange={onValueChange} />)
    await userEvent.tab()
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B')
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Delta' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Delta' })).toHaveFocus()
    await userEvent.keyboard('{Home}{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Delta' })).toHaveFocus()
    expect(onValueChange.mock.calls.map(([v]) => v)).toEqual([
      'b',
      'd',
      'a',
      'd',
      'a',
      'd',
    ])
  })

  it('in manual mode, arrows only move focus until Enter', async () => {
    render(<Example activation="manual" />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel A')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B')
  })

  it('throws a clear error outside Tabs', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Tab value="x">x</Tab>)).toThrow(
      '<Tab> must be used inside <Tabs>.'
    )
  })

  it('renders every panel on the server', () => {
    const html = renderToString(<Example />)
    expect(html).toContain('Panel B')
  })
})

describe('feedback', () => {
  it('Alert stays quiet by default and announces on request', () => {
    const onDismiss = vi.fn()
    render(
      <>
        <Alert title="Saved" tone="positive" data-testid="quiet">
          Changes saved.
        </Alert>
        <Alert title="Failed" tone="negative" announce onDismiss={onDismiss}>
          Try again.
        </Alert>
        <Alert title="Heads up" tone="info" announce />
      </>
    )
    expect(screen.getByTestId('quiet')).not.toHaveAttribute('role')
    expect(screen.getByRole('alert')).toHaveTextContent('Failed')
    expect(screen.getByRole('status')).toHaveTextContent('Heads up')
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('Badge applies tone and variant', () => {
    render(
      <Badge tone="positive" variant="solid">
        Live
      </Badge>
    )
    expect(screen.getByText('Live')).toHaveClass(
      'greese-Badge--positive',
      'greese-Badge--solid'
    )
  })

  it('Chip removes with a named button and toggles when selectable', async () => {
    const onRemove = vi.fn()
    const onSelectedChange = vi.fn()
    render(
      <>
        <Chip onRemove={onRemove}>Design</Chip>
        <Chip selectable onSelectedChange={onSelectedChange}>
          In stock
        </Chip>
      </>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Remove Design' }))
    expect(onRemove).toHaveBeenCalled()
    const toggle = screen.getByRole('button', { name: 'In stock' })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle.parentElement).toHaveClass('greese-Chip--selected')
    expect(onSelectedChange).toHaveBeenCalledWith(true)
  })

  it('Spinner and Progress are announced; Skeleton is hidden', () => {
    render(
      <>
        <Spinner label="Fetching results" />
        <Progress aria-label="Upload" value={40} />
        <Progress aria-label="Working" />
        <Skeleton data-testid="lines" lines={3} />
      </>
    )
    expect(screen.getByRole('status', { name: 'Fetching results' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Upload' })).toHaveAttribute(
      'value',
      '40'
    )
    expect(screen.getByRole('progressbar', { name: 'Working' })).not.toHaveAttribute(
      'value'
    )
    const lines = screen.getByTestId('lines')
    expect(lines).toHaveAttribute('aria-hidden', 'true')
    expect(lines.children).toHaveLength(3)
  })

  it('Skeleton passes sizes as variables', () => {
    render(<Skeleton data-testid="s" shape="circle" width="3rem" />)
    const s = screen.getByTestId('s')
    expect(s).toHaveClass('greese-Skeleton--circle')
    expect(s.style.getPropertyValue('--greese-skeleton-width')).toBe('3rem')
  })
})

describe('Phase 4 accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <main>
        <Heading level={1}>Title</Heading>
        <Text>
          Read the <Link href="/docs">docs</Link> or run <Code>npm i</Code>.
        </Text>
        <Card>
          <CardMedia>
            <Image alt="Cover" src="data:," ratio={2} />
          </CardMedia>
          <Badge>New</Badge>
        </Card>
        <Accordion exclusive>
          <AccordionItem title="Shipping">Ships in 2 days.</AccordionItem>
        </Accordion>
        <Tabs defaultValue="a">
          <TabList aria-label="Views">
            <Tab value="a">A</Tab>
            <Tab value="b">B</Tab>
          </TabList>
          <TabPanel value="a">A content</TabPanel>
          <TabPanel value="b">B content</TabPanel>
        </Tabs>
        <Alert title="Note" onDismiss={() => {}}>
          Hello
        </Alert>
        <AvatarGroup aria-label="Team">
          <Avatar name="Ada Lovelace" />
        </AvatarGroup>
        <Chip onRemove={() => {}}>Tag</Chip>
        <Progress aria-label="Progress" value={50} />
        <Spinner />
        <Skeleton />
      </main>
    )
    await expectNoAxeViolations(container)
  })
})

describe('brand tones', () => {
  const brand = ['primary', 'secondary', 'tertiary'] as const

  it.each(brand)('every tone prop takes %s', async (tone) => {
    const { container } = render(
      <>
        <Button tone={tone}>Save</Button>
        <IconButton tone={tone} label="Star">
          *
        </IconButton>
        <ToggleButton tone={tone}>Bold</ToggleButton>
        <Badge tone={tone}>New</Badge>
        <Chip tone={tone}>Tag</Chip>
        <Text tone={tone}>Body</Text>
        <Heading tone={tone}>Title</Heading>
        <Link href="#" tone={tone}>
          Docs
        </Link>
        <Alert tone={tone} title="News" />
      </>
    )
    for (const block of ['Button', 'Badge', 'Chip', 'Text', 'Link', 'Alert'])
      expect(container.querySelector(`.greese-${block}--${tone}`)).not.toBeNull()
    expect(container.querySelectorAll(`.greese-Button--${tone}`)).toHaveLength(3)
    await expectNoAxeViolations(container)
  })

  it('Chip: no tone keeps today’s look; a selectable chip selects to its tone', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <>
        <Chip>Plain</Chip>
        <Chip selectable tone="secondary">
          Filter
        </Chip>
      </>
    )
    const [plain, filter] = container.querySelectorAll('.greese-Chip')
    expect(plain!.className).toBe('greese-Chip')
    expect(filter).toHaveClass('greese-Chip--secondary')
    expect(filter).not.toHaveClass('greese-Chip--selected')
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    expect(filter).toHaveClass('greese-Chip--secondary', 'greese-Chip--selected')
  })
})
