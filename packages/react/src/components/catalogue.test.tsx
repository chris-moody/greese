import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../test/axe.ts'
import { ScrollCarousel, ScrollCarouselSlide } from './ScrollCarousel/ScrollCarousel.tsx'
import { ChatBubble } from './ChatBubble/ChatBubble.tsx'
import { Countdown, durationText, splitDuration } from './Countdown/Countdown.tsx'
import { Diff } from './Diff/Diff.tsx'
import { Dock, DockItem } from './Dock/Dock.tsx'
import { Field } from './Field/Field.tsx'
import { Fieldset } from './Fieldset/Fieldset.tsx'
import { Indicator } from './Indicator/Indicator.tsx'
import { Key } from './Key/Key.tsx'
import { List, ListItem } from './List/List.tsx'
import { OtpField, sanitizeOtp } from './OtpField/OtpField.tsx'
import { RadialProgress, radialPercent } from './RadialProgress/RadialProgress.tsx'
import { Rating, ratingAt } from './Rating/Rating.tsx'
import { SpeedDial, SpeedDialAction } from './SpeedDial/SpeedDial.tsx'
import { Stat, StatGroup } from './Stat/Stat.tsx'
import { Status } from './Status/Status.tsx'
import { Step, Steps, stepStatus } from './Steps/Steps.tsx'
import { Swap } from './Swap/Swap.tsx'
import { TEXT_ROTATE_MAX, TextRotate } from './TextRotate/TextRotate.tsx'

const Icon = () => <svg aria-hidden="true" />

describe('Key', () => {
  it('is a native <kbd>, nestable for shortcuts', async () => {
    const { container } = render(
      <p>
        Press{' '}
        <Key>
          <Key>Ctrl</Key> + <Key>K</Key>
        </Key>
      </p>
    )
    const keys = container.querySelectorAll('kbd')
    expect(keys).toHaveLength(3)
    expect(keys[1]).toHaveClass('greese-Key', 'greese-Key--md')
    await expectNoAxeViolations(container)
  })
})

describe('Status', () => {
  it('is an image named by its label, or decorative without one', async () => {
    const { container } = render(
      <>
        <Status tone="positive" label="Online" pulse />
        <Status data-testid="plain" />
      </>
    )
    expect(screen.getByRole('img', { name: 'Online' })).toHaveClass(
      'greese-Status--positive',
      'greese-Status--pulse'
    )
    expect(screen.getByTestId('plain')).toHaveAttribute('aria-hidden', 'true')
    await expectNoAxeViolations(container)
  })
})

describe('Indicator', () => {
  it('pins its content to a corner of its child', () => {
    render(
      <Indicator content={<span>3</span>} placement="bottom-start">
        <button type="button">Inbox</button>
      </Indicator>
    )
    expect(screen.getByText('3').parentElement).toHaveClass(
      'greese-Indicator-item',
      'greese-Indicator-item--bottom-start'
    )
    expect(screen.getByRole('button', { name: 'Inbox' })).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <Indicator content={<span>3 unread</span>}>
        <button type="button">Inbox</button>
      </Indicator>
    )
    await expectNoAxeViolations(container)
  })
})

describe('Stat', () => {
  it('pairs the label and value in a description list', async () => {
    const { container } = render(
      <StatGroup rowFrom="md">
        <Stat label="Revenue" value="$48,200" description="up 12%" tone="positive" />
        <Stat label="Orders" value="1,204" />
      </StatGroup>
    )
    expect(container.firstChild).toHaveClass('greese-StatGroup--row-md')
    const term = screen.getByText('Revenue')
    expect(term.tagName).toBe('DT')
    expect(term.nextElementSibling).toHaveTextContent('$48,200')
    expect(screen.getByText('up 12%')).toHaveClass('greese-Stat-description--positive')
    await expectNoAxeViolations(container)
  })
})

describe('Fieldset', () => {
  it('names the group with its legend and describes it', async () => {
    const { container } = render(
      <Fieldset legend="Shipping" description="Where we deliver." error="Required">
        <label>
          Street <input />
        </label>
      </Fieldset>
    )
    const group = screen.getByRole('group', { name: 'Shipping' })
    expect(group).toHaveAccessibleDescription('Where we deliver. Required')
    await expectNoAxeViolations(container)
  })

  it('disables every control inside, natively', () => {
    render(
      <Fieldset legend="Plan" disabled>
        <input aria-label="Seats" />
      </Fieldset>
    )
    expect(screen.getByRole('textbox', { name: 'Seats' })).toBeDisabled()
  })
})

describe('RadialProgress', () => {
  it('is a named progressbar showing its percentage', async () => {
    const { container } = render(
      <RadialProgress value={36} max={50} aria-label="Storage" />
    )
    const bar = screen.getByRole('progressbar', { name: 'Storage' })
    expect(bar).toHaveAttribute('aria-valuenow', '36')
    expect(bar).toHaveTextContent('72%')
    expect(bar.style.getPropertyValue('--greese-radialprogress-value')).toBe('72')
    await expectNoAxeViolations(container)
  })

  it('is indeterminate without a value', () => {
    render(<RadialProgress aria-label="Loading" />)
    const bar = screen.getByRole('progressbar', { name: 'Loading' })
    expect(bar).not.toHaveAttribute('aria-valuenow')
    expect(bar).toHaveClass('greese-RadialProgress--indeterminate')
  })

  it('clamps the percentage', () => {
    expect(radialPercent(150, 100)).toBe(100)
    expect(radialPercent(-5, 100)).toBe(0)
    expect(radialPercent(1, 3)).toBe(33)
    expect(radialPercent(5, 0)).toBe(0)
  })
})

describe('TextRotate', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <p>
        Builds that are <TextRotate items={['faster', 'smaller', 'lighter']} />
      </p>
    )
    await expectNoAxeViolations(container)
  })

  it('reads every item once and animates a hidden copy', () => {
    const { container } = render(<TextRotate items={['faster', 'smaller', 'lighter']} />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveClass('greese-TextRotate--3')
    expect(root.style.getPropertyValue('--greese-textrotate-duration')).toBe('7.5s')
    expect(screen.getByText('faster, smaller, lighter')).toHaveClass(
      'greese-VisuallyHidden'
    )
    const track = root.querySelector('.greese-TextRotate-track')!
    expect(track).toHaveAttribute('aria-hidden', 'true')
    // The first again at the end, for a seamless loop.
    expect(track.children).toHaveLength(4)
  })

  it(`keeps at most ${TEXT_ROTATE_MAX} items, and doesn't animate one`, () => {
    const many = Array.from({ length: 12 }, (_, i) => `w${i}`)
    const { container, rerender } = render(<TextRotate items={many} />)
    expect(container.firstChild).toHaveClass(`greese-TextRotate--${TEXT_ROTATE_MAX}`)
    rerender(<TextRotate items={['only']} />)
    expect((container.firstChild as HTMLElement).className).toBe('greese-TextRotate')
  })
})

describe('Steps', () => {
  it('marks the current step and announces completed ones', async () => {
    const { container } = render(
      <Steps current={1} aria-label="Checkout" direction="horizontal">
        <Step>Cart</Step>
        <Step>Shipping</Step>
        <Step description="Card or PayPal">Payment</Step>
      </Steps>
    )
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveClass('greese-Step--complete')
    expect(items[0]).toHaveTextContent('Completed: Cart')
    expect(items[1]).toHaveAttribute('aria-current', 'step')
    expect(items[2]).toHaveClass('greese-Step--upcoming')
    expect(items[2]!.querySelector('.greese-Step-marker')).toHaveTextContent('3')
    await expectNoAxeViolations(container)
  })

  it('numbers steps passed in a fragment', () => {
    render(
      <Steps current={1}>
        <>
          <Step>One</Step>
          <Step>Two</Step>
        </>
      </Steps>
    )
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveClass('greese-Step--complete')
    expect(items[1]!.querySelector('.greese-Step-marker')).toHaveTextContent('2')
  })

  it('lets a step override its status', () => {
    render(
      <Steps current={0}>
        <Step>One</Step>
        <Step status="complete" tone="negative">
          Two
        </Step>
      </Steps>
    )
    expect(screen.getAllByRole('listitem')[1]).toHaveClass(
      'greese-Step--complete',
      'greese-Step--negative'
    )
  })

  it('derives a status from the index, and none without a current step', () => {
    expect(stepStatus(0, 1)).toBe('complete')
    expect(stepStatus(1, 1)).toBe('current')
    expect(stepStatus(2, 1)).toBe('upcoming')
    expect(stepStatus(0, undefined)).toBeUndefined()
  })

  it('is a timeline without `current`: events with dots and prefixes', async () => {
    const { container } = render(
      <Steps direction="vertical" markers="dots" aria-label="Activity">
        <Step
          prefix={<time dateTime="2026-10-19T09:12">09:12</time>}
          prefixBefore
          tone="positive"
          description="Version 1.4 is live."
        >
          Deployed
        </Step>
        <Step prefix="Yesterday">Opened</Step>
      </Steps>
    )
    const list = screen.getByRole('list', { name: 'Activity' })
    expect(list).toHaveClass('greese-Steps--vertical', 'greese-Steps--dots')
    const [deployed, opened] = screen.getAllByRole('listitem')
    expect(deployed).toHaveClass('greese-Step--event', 'greese-Step--prefix-before')
    expect(deployed).not.toHaveAttribute('aria-current')
    expect(deployed).not.toHaveTextContent('Completed')
    // Before the marker, or above the title.
    expect(deployed!.firstElementChild).toHaveClass('greese-Step-prefix')
    expect(
      opened!.querySelector('.greese-Step-body > .greese-Step-prefix')
    ).toHaveTextContent('Yesterday')
    expect(deployed!.querySelector('.greese-Step-marker')).toBeEmptyDOMElement()
    expect(container.querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-10-19T09:12'
    )
    await expectNoAxeViolations(container)
  })
})

describe('List', () => {
  it('renders rows with media, text and actions', async () => {
    const { container } = render(
      <List framed>
        <ListItem
          start={<span>AL</span>}
          title="Ada Lovelace"
          description="Analyst"
          end={<button type="button">Message</button>}
        />
      </List>
    )
    const item = screen.getByRole('listitem')
    expect(within(item).getByText('Ada Lovelace')).toHaveClass('greese-ListItem-title')
    expect(within(item).getByRole('button', { name: 'Message' })).toBeInTheDocument()
    expect(screen.getByRole('list')).toHaveClass(
      'greese-List--divided',
      'greese-List--framed'
    )
    await expectNoAxeViolations(container)
  })
})

describe('ChatBubble', () => {
  it('shows a message with its author, time and status', async () => {
    const { container } = render(
      <div role="log" aria-label="Messages">
        <ChatBubble author="Ada" time="09:12">
          Ready?
        </ChatBubble>
        <ChatBubble side="end" footer="Seen">
          On my way.
        </ChatBubble>
      </div>
    )
    const [theirs, mine] = container.querySelectorAll('.greese-ChatBubble')
    expect(theirs).toHaveClass('greese-ChatBubble--start', 'greese-ChatBubble--neutral')
    expect(mine).toHaveClass('greese-ChatBubble--end', 'greese-ChatBubble--primary')
    expect(screen.getByText('Seen')).toHaveClass('greese-ChatBubble-footer')
    await expectNoAxeViolations(container)
  })
})

describe('Dock', () => {
  it('is a named navigation landmark marking the current page', async () => {
    const { container } = render(
      <Dock position="static" hideFrom="md">
        <DockItem href="#home" icon={<Icon />} current>
          Home
        </DockItem>
        <DockItem href="#search" icon={<Icon />}>
          Search
        </DockItem>
      </Dock>
    )
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toHaveClass('greese-Dock--static', 'greese-Dock--hide-from-md')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    await expectNoAxeViolations(container)
  })

  it('keeps its icon with asChild', () => {
    render(
      <Dock>
        <DockItem asChild icon={<Icon />}>
          <button type="button">Menu</button>
        </DockItem>
      </Dock>
    )
    const button = screen.getByRole('button', { name: 'Menu' })
    expect(button).toHaveClass('greese-DockItem-link')
    expect(button.querySelector('.greese-DockItem-icon')).not.toBeNull()
  })
})

describe('Countdown accessibility', () => {
  // Outside the fake timers below: axe waits on real ones.
  it('has no axe violations, as a clock or with labels', async () => {
    const { container } = render(
      <>
        <Countdown seconds={3725} running={false} />
        <Countdown seconds={90} running={false} format="labels" />
      </>
    )
    await expectNoAxeViolations(container)
  })
})

describe('Countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down against the clock and says the time left', () => {
    const onComplete = vi.fn()
    render(<Countdown seconds={62} onComplete={onComplete} />)
    const timer = screen.getByRole('timer')
    expect(timer).toHaveTextContent('0:01:02')
    expect(timer).toHaveAccessibleName('0 hours, 1 minute, 2 seconds')
    act(() => vi.advanceTimersByTime(2000))
    expect(timer).toHaveTextContent('0:01:00')
    act(() => vi.advanceTimersByTime(60_000))
    expect(timer).toHaveTextContent('0:00:00')
    act(() => vi.advanceTimersByTime(5000))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('freezes when not running, and restarts from a new value', () => {
    const { rerender } = render(
      <Countdown seconds={10} running={false} format="labels" />
    )
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByRole('timer')).toHaveTextContent('0h0m10s')
    rerender(<Countdown seconds={90} running={false} format="labels" />)
    expect(screen.getByRole('timer')).toHaveTextContent('0h1m30s')
  })

  it('splits durations into units, the largest taking the rest', () => {
    expect(splitDuration(90061, ['days', 'hours', 'minutes', 'seconds'])).toEqual([
      ['days', 1],
      ['hours', 1],
      ['minutes', 1],
      ['seconds', 1],
    ])
    expect(splitDuration(360000, ['hours', 'minutes'])).toEqual([
      ['hours', 100],
      ['minutes', 0],
    ])
    expect(splitDuration(-5, ['seconds'])).toEqual([['seconds', 0]])
    expect(
      durationText([
        ['minutes', 1],
        ['seconds', 2],
      ])
    ).toBe('1 minute, 2 seconds')
  })
})

describe('Swap', () => {
  it('toggles aria-pressed and swaps content, keeping its name', async () => {
    const onPressedChange = vi.fn()
    const { container } = render(
      <Swap
        label="Dark mode"
        on="🌙"
        off="☀️"
        effect="rotate"
        onPressedChange={onPressedChange}
      />
    )
    const button = screen.getByRole('button', { name: 'Dark mode' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(onPressedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('button', { name: 'Dark mode' })).toBe(button)
    await expectNoAxeViolations(container)
  })
})

describe('Rating', () => {
  it('is a named radio group of stars', async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <Rating label="Your rating" defaultValue={2} onValueChange={onValueChange} />
    )
    expect(screen.getByRole('group', { name: 'Your rating' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(screen.getByRole('radio', { name: '2 stars' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }))
    expect(onValueChange).toHaveBeenLastCalledWith(4)
    expect(screen.getByRole('radio', { name: '4 stars' })).toBeChecked()
    await expectNoAxeViolations(container)
  })

  it('changes with the arrow keys', async () => {
    render(<Rating label="Rating" defaultValue={3} />)
    screen.getByRole('radio', { name: '3 stars' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: '4 stars' })).toBeChecked()
  })

  it('clears when the current rating is chosen again, with allowClear', async () => {
    const onValueChange = vi.fn()
    render(
      <Rating label="Rating" defaultValue={3} allowClear onValueChange={onValueChange} />
    )
    await userEvent.click(screen.getByRole('radio', { name: '3 stars' }))
    expect(onValueChange).toHaveBeenLastCalledWith(0)
    expect(screen.queryByRole('radio', { checked: true })).toBeNull()
  })

  it('offers half and quarter stars with `step`', async () => {
    const onValueChange = vi.fn()
    render(
      <Rating
        label="Rating"
        step={0.25}
        max={2}
        defaultValue={1.5}
        onValueChange={onValueChange}
      />
    )
    expect(screen.getAllByRole('radio')).toHaveLength(8)
    expect(screen.getByRole('radio', { name: '1.5 stars' })).toBeChecked()
    const group = screen.getByRole('group', { name: 'Rating' })
    expect(group.style.getPropertyValue('--greese-rating-fill')).toBe('75%')
    screen.getByRole('radio', { name: '1.5 stars' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith(1.75)
  })

  it('maps a point along the stars to a value, rounded up to the step', () => {
    expect(ratingAt(0.5, 5, 1)).toBe(3)
    expect(ratingAt(0.5, 5, 0.5)).toBe(2.5)
    expect(ratingAt(0.51, 5, 0.25)).toBe(2.75)
    expect(ratingAt(0, 5, 0.25)).toBe(0.25)
    expect(ratingAt(1.2, 5, 1)).toBe(5)
  })

  it('shows a value, fractions included, when read-only', async () => {
    const { container } = render(<Rating label="Average" readOnly value={3.5} max={5} />)
    const img = screen.getByRole('img', { name: 'Average: 3.5 out of 5' })
    expect(img.style.getPropertyValue('--greese-rating-fill')).toBe('70%')
    expect(screen.queryByRole('radio')).toBeNull()
    await expectNoAxeViolations(container)
  })
})

describe('OtpField', () => {
  it('is one labelled input for SMS autofill', async () => {
    const { container } = render(
      <Field label="Code" description="Sent by text">
        <OtpField length={4} />
      </Field>
    )
    const input = screen.getByRole('textbox', { name: 'Code' })
    expect(input).toHaveAttribute('autocomplete', 'one-time-code')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(input).toHaveAttribute('maxlength', '4')
    expect(input).toHaveAccessibleDescription('Sent by text')
    expect(container.querySelectorAll('.greese-OtpField-slot')).toHaveLength(4)
    await expectNoAxeViolations(container)
  })

  it('keeps allowed characters and reports a complete code once', async () => {
    const onComplete = vi.fn()
    const onValueChange = vi.fn()
    const { container } = render(
      <OtpField
        aria-label="Code"
        length={4}
        onComplete={onComplete}
        onValueChange={onValueChange}
      />
    )
    const input = screen.getByRole('textbox', { name: 'Code' })
    fireEvent.change(input, { target: { value: '1a2-3' } })
    expect(onValueChange).toHaveBeenLastCalledWith('123')
    const slots = container.querySelectorAll('.greese-OtpField-slot')
    expect([...slots].map((s) => s.textContent)).toEqual(['1', '2', '3', ''])
    fireEvent.change(input, { target: { value: '1234' } })
    expect(onComplete).toHaveBeenCalledWith('1234')
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('masks characters when asked', () => {
    const { container } = render(<OtpField aria-label="PIN" mask defaultValue="12" />)
    expect(container.querySelector('input')).toHaveAttribute('type', 'password')
    expect(container.querySelector('.greese-OtpField-slot')).toHaveTextContent('•')
  })

  it('sanitises by mode', () => {
    expect(sanitizeOtp(' 12 34 56 7', 6, 'numeric')).toBe('123456')
    expect(sanitizeOtp('ab-c1', 6, 'alphanumeric')).toBe('ABC1')
  })
})

describe('ScrollCarousel', () => {
  let observed: IntersectionObserverCallback | undefined
  beforeEach(() => {
    observed = undefined
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          observed = callback
        }
        observe() {}
        disconnect() {}
      }
    )
    HTMLElement.prototype.scrollTo = vi.fn() as typeof HTMLElement.prototype.scrollTo
    // jsdom has no layout: give the viewport three slides' width to scroll.
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(900)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const slides = (
    <>
      <ScrollCarouselSlide>One</ScrollCarouselSlide>
      <ScrollCarouselSlide>Two</ScrollCarouselSlide>
      <ScrollCarouselSlide label="The last">Three</ScrollCarouselSlide>
    </>
  )

  it('is a named carousel of labelled slides', async () => {
    const { container } = render(<ScrollCarousel label="Featured">{slides}</ScrollCarousel>)
    expect(screen.getByRole('region', { name: 'Featured' })).toHaveAttribute(
      'aria-roledescription',
      'carousel'
    )
    const groups = screen.getAllByRole('group')
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual([
      '1 of 3',
      '2 of 3',
      'The last',
    ])
    await expectNoAxeViolations(container)
  })

  it('moves with the buttons and dots, and reports the index', async () => {
    const onIndexChange = vi.fn()
    render(
      <ScrollCarousel
        label="Featured"
        onIndexChange={onIndexChange}
        perView={{ xs: 1, md: 2.5 }}
      >
        {slides}
      </ScrollCarousel>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Next slide' }))
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
    // jsdom has no layout, so every slide is "already in view": no scroll.
    expect(screen.getByRole('button', { name: 'Slide 2' })).toHaveAttribute(
      'aria-current',
      'true'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Slide 3' }))
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
    expect(screen.getByRole('button', { name: 'Slide 3' })).toHaveAttribute(
      'aria-current',
      'true'
    )
    const viewport = screen.getByRole('region').firstElementChild as HTMLElement
    expect(viewport).toHaveClass(
      'greese-ScrollCarousel--xs-per-view',
      'greese-ScrollCarousel--md-per-view'
    )
    expect(viewport.style.getPropertyValue('--greese-scrollcarousel-per-view-md')).toBe('2.5')
  })

  it('follows the slide scrolled into view', () => {
    const onIndexChange = vi.fn()
    render(
      <ScrollCarousel label="Featured" onIndexChange={onIndexChange}>
        {slides}
      </ScrollCarousel>
    )
    const groups = screen.getAllByRole('group')
    act(() =>
      observed!(
        [
          {
            target: groups[1]!,
            intersectionRatio: 1,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )
    )
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
  })
})

describe('Diff', () => {
  it('moves the divider with a named range input', async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <Diff
        label="Before and after"
        before={<img src="a.png" alt="Before" />}
        after={<img src="b.png" alt="After" />}
        onValueChange={onValueChange}
      />
    )
    const slider = screen.getByRole('slider', { name: 'Before and after' })
    expect(slider).toHaveValue('50')
    fireEvent.change(slider, { target: { value: '30' } })
    expect(onValueChange).toHaveBeenCalledWith(30)
    expect(
      (container.firstChild as HTMLElement).style.getPropertyValue(
        '--greese-diff-position'
      )
    ).toBe('30%')
    expect(slider).toHaveAttribute('aria-valuetext', '30%')
    await expectNoAxeViolations(container)
  })
})

describe('SpeedDial', () => {
  it('opens a group of actions from its button and closes after one', async () => {
    const onClick = vi.fn()
    const { container } = render(
      <SpeedDial label="Create" position="static">
        <SpeedDialAction label="Document" icon={<Icon />} onClick={onClick} />
        <SpeedDialAction label="Folder" icon={<Icon />} />
      </SpeedDial>
    )
    const trigger = screen.getByRole('button', { name: 'Create' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Document' }))
    expect(onClick).toHaveBeenCalled()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expectNoAxeViolations(container)
  })
})
