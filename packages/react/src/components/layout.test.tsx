import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../test/axe.ts'
import { AspectRatio } from './AspectRatio/AspectRatio.tsx'
import { Box } from './Box/Box.tsx'
import { Center } from './Center/Center.tsx'
import { Container } from './Container/Container.tsx'
import { Divider } from './Divider/Divider.tsx'
import { Grid, GridItem } from './Grid/Grid.tsx'
import { Spacer } from './Spacer/Spacer.tsx'
import { Stack } from './Stack/Stack.tsx'
import { Hide, Show } from './Visibility/Visibility.tsx'

const classes = (el: Element) => el.className.split(' ').sort()

describe('Box', () => {
  it('renders a plain div with no style when given no style props', () => {
    render(<Box data-testid="b" id="x" />)
    const box = screen.getByTestId('b')
    expect(box.tagName).toBe('DIV')
    expect(box.className).toBe('sauce-Box')
    expect(box.getAttribute('style')).toBeNull()
    expect(box).toHaveAttribute('id', 'x')
  })

  it('resolves spacing inline and enum props to classes', () => {
    render(
      <Box
        data-testid="b"
        p={{ xs: 4, md: '2rem' }}
        mx="auto"
        display={{ xs: 'none', md: 'block' }}
        maxW="40rem"
      />
    )
    const box = screen.getByTestId('b')
    expect(classes(box)).toEqual(
      [
        'sauce-Box',
        'sauce-Box--display',
        'sauce-Box--max-w',
        'sauce-Box--md-display-block',
        'sauce-Box--mx',
        'sauce-Box--p',
        'sauce-Box--xs-display-none',
      ].sort()
    )
    expect(box.style.getPropertyValue('--sauce-box-p-xs')).toBe('var(--sauce-space-4)')
    expect(box.style.getPropertyValue('--sauce-box-p-md')).toBe('2rem')
    expect(box.style.getPropertyValue('--sauce-box-mx-xs')).toBe('auto')
    expect(box.style.getPropertyValue('--sauce-box-max-w-xs')).toBe('40rem')
  })

  it('merges className and style, letting caller style win', () => {
    render(
      <Box
        data-testid="b"
        className="mine"
        p={2}
        style={{ color: 'red', ['--sauce-box-p-xs' as string]: '1px' }}
      />
    )
    const box = screen.getByTestId('b')
    expect(box).toHaveClass('sauce-Box', 'mine')
    expect(box.style.color).toBe('red')
    expect(box.style.getPropertyValue('--sauce-box-p-xs')).toBe('1px')
  })

  it('renders your element with asChild and forwards refs', () => {
    const ref = createRef<HTMLElement>()
    render(
      <Box asChild p={4} ref={ref}>
        <section aria-label="s" />
      </Box>
    )
    const section = screen.getByRole('region', { name: 's' })
    expect(ref.current).toBe(section)
    expect(section).toHaveClass('sauce-Box', 'sauce-Box--p')
  })
})

describe('Stack', () => {
  it('combines its own responsive props with Box style props', () => {
    render(
      <Stack
        data-testid="s"
        direction={{ xs: 'column', md: 'row' }}
        gap={{ xs: 2, lg: '13px' }}
        align="center"
        justify="between"
        wrap="wrap"
        p={4}
      />
    )
    const stack = screen.getByTestId('s')
    expect(classes(stack)).toEqual(
      [
        'sauce-Box',
        'sauce-Box--p',
        'sauce-Stack',
        'sauce-Stack--align',
        'sauce-Stack--direction',
        'sauce-Stack--gap',
        'sauce-Stack--justify',
        'sauce-Stack--md-direction-row',
        'sauce-Stack--wrap',
        'sauce-Stack--xs-align-center',
        'sauce-Stack--xs-direction-column',
        'sauce-Stack--xs-gap-2',
        'sauce-Stack--xs-justify-between',
        'sauce-Stack--xs-wrap-wrap',
      ].sort()
    )
    expect(stack.style.getPropertyValue('--sauce-stack-gap-lg')).toBe('13px')
    expect(stack.style.getPropertyValue('--sauce-box-p-xs')).toBe('var(--sauce-space-4)')
  })
})

describe('Grid and GridItem', () => {
  it('maps column counts to classes and templates or widths to variables', () => {
    render(
      <Grid
        data-testid="g"
        columns={{ xs: 1, md: '200px 1fr' }}
        minChildWidth={{ lg: '14rem' }}
        gap={4}
        container
      >
        <GridItem data-testid="i" span={{ xs: 'full', md: 6 }} />
      </Grid>
    )
    const grid = screen.getByTestId('g')
    expect(grid).toHaveClass(
      'sauce-Grid',
      'sauce-Grid--container',
      'sauce-Grid--columns',
      'sauce-Grid--xs-columns-1',
      'sauce-Grid--min-child',
      'sauce-Grid--xs-gap-4'
    )
    expect(grid.style.getPropertyValue('--sauce-grid-columns-md')).toBe('200px 1fr')
    expect(grid.style.getPropertyValue('--sauce-grid-min-child-lg')).toBe('14rem')
    expect(screen.getByTestId('i')).toHaveClass(
      'sauce-GridItem',
      'sauce-GridItem--span',
      'sauce-GridItem--xs-span-full',
      'sauce-GridItem--md-span-6'
    )
  })
})

describe('Container, Center, Spacer, Divider, AspectRatio', () => {
  it('Container defaults to the lg size', () => {
    render(<Container data-testid="c" />)
    expect(screen.getByTestId('c')).toHaveClass(
      'sauce-Container',
      'sauce-Container--size-lg'
    )
  })

  it('Center can be inline', () => {
    render(<Center data-testid="c" inline />)
    expect(screen.getByTestId('c')).toHaveClass('sauce-Center', 'sauce-Center--inline')
  })

  it('Spacer is hidden from assistive tech and takes a fixed size', () => {
    render(<Spacer data-testid="s" size={{ xs: 2, md: '3rem' }} />)
    const spacer = screen.getByTestId('s')
    expect(spacer).toHaveAttribute('aria-hidden', 'true')
    expect(spacer).toHaveClass('sauce-Spacer', 'sauce-Spacer--size')
    expect(spacer.style.getPropertyValue('--sauce-spacer-size-xs')).toBe(
      'var(--sauce-space-2)'
    )
  })

  it('Divider is a separator that reports vertical orientation', () => {
    render(
      <>
        <Divider />
        <Divider orientation="vertical" />
      </>
    )
    const [horizontal, vertical] = screen.getAllByRole('separator')
    expect(horizontal).not.toHaveAttribute('aria-orientation')
    expect(horizontal).toHaveAttribute('data-orientation', 'horizontal')
    expect(vertical).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('AspectRatio sets the ratio inline and the fit by class', () => {
    render(<AspectRatio data-testid="a" ratio={{ xs: 1, md: 16 / 9 }} fit="contain" />)
    const frame = screen.getByTestId('a')
    expect(frame).toHaveClass('sauce-AspectRatio', 'sauce-AspectRatio--contain')
    expect(frame.style.getPropertyValue('--sauce-aspectratio-ratio-xs')).toBe('1')
    expect(frame.style.getPropertyValue('--sauce-aspectratio-ratio-md')).toBe(
      String(16 / 9)
    )
  })
})

describe('Show and Hide', () => {
  it('map ranges onto hide classes', () => {
    render(
      <>
        <Show above="md">
          <span>show-above</span>
        </Show>
        <Show above="sm" below="lg">
          <span>show-range</span>
        </Show>
        <Hide above="md">
          <span>hide-above</span>
        </Hide>
        <Hide below="sm">
          <span>hide-below</span>
        </Hide>
        <Hide above="sm" below="lg">
          <span>hide-range</span>
        </Hide>
        <Hide above="lg" below="sm">
          <span>hide-outside</span>
        </Hide>
      </>
    )
    const wrapper = (text: string) => screen.getByText(text).parentElement!
    expect(classes(wrapper('show-above'))).toEqual([
      'sauce-Visibility',
      'sauce-Visibility--hide-below-md',
    ])
    expect(classes(wrapper('show-range'))).toEqual([
      'sauce-Visibility',
      'sauce-Visibility--hide-below-sm',
      'sauce-Visibility--hide-from-lg',
    ])
    expect(classes(wrapper('hide-above'))).toEqual([
      'sauce-Visibility',
      'sauce-Visibility--hide-from-md',
    ])
    expect(classes(wrapper('hide-below'))).toEqual([
      'sauce-Visibility',
      'sauce-Visibility--hide-below-sm',
    ])
    // Both bounds: hidden only between them, not at every width.
    expect(classes(wrapper('hide-range'))).toEqual([
      'sauce-Visibility',
      'sauce-Visibility--hide-sm-to-lg',
    ])
    expect(classes(wrapper('hide-outside'))).toEqual([
      'sauce-Visibility',
      'sauce-Visibility--hide-below-sm',
      'sauce-Visibility--hide-from-lg',
    ])
  })

  it('apply straight to your element with asChild', () => {
    render(
      <Show above="lg" asChild className="mine">
        <nav aria-label="desktop" />
      </Show>
    )
    expect(screen.getByRole('navigation')).toHaveAttribute(
      'class',
      'sauce-Visibility--hide-below-lg mine'
    )
  })
})

describe('layout primitives', () => {
  it('render on the server without hooks or browser APIs', () => {
    const html = renderToString(
      <Container>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
          <Grid columns={2}>
            <GridItem span={2} />
          </Grid>
          <Center>
            <Spacer />
          </Center>
          <Divider />
          <AspectRatio ratio={1} />
          <Show above="md">x</Show>
        </Stack>
      </Container>
    )
    expect(html).toContain('sauce-Stack--md-direction-row')
  })

  it('have no accessibility violations together', async () => {
    const { container } = render(
      <Container asChild>
        <main>
          <Stack gap={4}>
            <h1>Title</h1>
            <Divider />
            <Grid minChildWidth="10rem" gap={2}>
              <GridItem>one</GridItem>
              <GridItem>two</GridItem>
            </Grid>
            <AspectRatio ratio={16 / 9}>
              <img src="data:," alt="Placeholder" />
            </AspectRatio>
          </Stack>
        </main>
      </Container>
    )
    await expectNoAxeViolations(container)
  })
})
