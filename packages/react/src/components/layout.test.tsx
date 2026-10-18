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
    expect(box.className).toBe('greese-Box')
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
        'greese-Box',
        'greese-Box--display',
        'greese-Box--max-w',
        'greese-Box--md-display-block',
        'greese-Box--mx',
        'greese-Box--p',
        'greese-Box--xs-display-none',
      ].sort()
    )
    expect(box.style.getPropertyValue('--greese-box-p-xs')).toBe('var(--greese-space-4)')
    expect(box.style.getPropertyValue('--greese-box-p-md')).toBe('2rem')
    expect(box.style.getPropertyValue('--greese-box-mx-xs')).toBe('auto')
    expect(box.style.getPropertyValue('--greese-box-max-w-xs')).toBe('40rem')
  })

  it('merges className and style, letting caller style win', () => {
    render(
      <Box
        data-testid="b"
        className="mine"
        p={2}
        style={{ color: 'red', ['--greese-box-p-xs' as string]: '1px' }}
      />
    )
    const box = screen.getByTestId('b')
    expect(box).toHaveClass('greese-Box', 'mine')
    expect(box.style.color).toBe('red')
    expect(box.style.getPropertyValue('--greese-box-p-xs')).toBe('1px')
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
    expect(section).toHaveClass('greese-Box', 'greese-Box--p')
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
        'greese-Box',
        'greese-Box--p',
        'greese-Stack',
        'greese-Stack--align',
        'greese-Stack--direction',
        'greese-Stack--gap',
        'greese-Stack--justify',
        'greese-Stack--md-direction-row',
        'greese-Stack--wrap',
        'greese-Stack--xs-align-center',
        'greese-Stack--xs-direction-column',
        'greese-Stack--xs-gap-2',
        'greese-Stack--xs-justify-between',
        'greese-Stack--xs-wrap-wrap',
      ].sort()
    )
    expect(stack.style.getPropertyValue('--greese-stack-gap-lg')).toBe('13px')
    expect(stack.style.getPropertyValue('--greese-box-p-xs')).toBe(
      'var(--greese-space-4)'
    )
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
      'greese-Grid',
      'greese-Grid--container',
      'greese-Grid--columns',
      'greese-Grid--xs-columns-1',
      'greese-Grid--min-child',
      'greese-Grid--xs-gap-4'
    )
    expect(grid.style.getPropertyValue('--greese-grid-columns-md')).toBe('200px 1fr')
    expect(grid.style.getPropertyValue('--greese-grid-min-child-lg')).toBe('14rem')
    expect(screen.getByTestId('i')).toHaveClass(
      'greese-GridItem',
      'greese-GridItem--span',
      'greese-GridItem--xs-span-full',
      'greese-GridItem--md-span-6'
    )
  })
})

describe('Container, Center, Spacer, Divider, AspectRatio', () => {
  it('Container defaults to the lg size', () => {
    render(<Container data-testid="c" />)
    expect(screen.getByTestId('c')).toHaveClass(
      'greese-Container',
      'greese-Container--size-lg'
    )
  })

  it('Center can be inline', () => {
    render(<Center data-testid="c" inline />)
    expect(screen.getByTestId('c')).toHaveClass('greese-Center', 'greese-Center--inline')
  })

  it('Spacer is hidden from assistive tech and takes a fixed size', () => {
    render(<Spacer data-testid="s" size={{ xs: 2, md: '3rem' }} />)
    const spacer = screen.getByTestId('s')
    expect(spacer).toHaveAttribute('aria-hidden', 'true')
    expect(spacer).toHaveClass('greese-Spacer', 'greese-Spacer--size')
    expect(spacer.style.getPropertyValue('--greese-spacer-size-xs')).toBe(
      'var(--greese-space-2)'
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
    expect(frame).toHaveClass('greese-AspectRatio', 'greese-AspectRatio--contain')
    expect(frame.style.getPropertyValue('--greese-aspectratio-ratio-xs')).toBe('1')
    expect(frame.style.getPropertyValue('--greese-aspectratio-ratio-md')).toBe(
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
      'greese-Visibility',
      'greese-Visibility--hide-below-md',
    ])
    expect(classes(wrapper('show-range'))).toEqual([
      'greese-Visibility',
      'greese-Visibility--hide-below-sm',
      'greese-Visibility--hide-from-lg',
    ])
    expect(classes(wrapper('hide-above'))).toEqual([
      'greese-Visibility',
      'greese-Visibility--hide-from-md',
    ])
    expect(classes(wrapper('hide-below'))).toEqual([
      'greese-Visibility',
      'greese-Visibility--hide-below-sm',
    ])
    // Both bounds: hidden only between them, not at every width.
    expect(classes(wrapper('hide-range'))).toEqual([
      'greese-Visibility',
      'greese-Visibility--hide-sm-to-lg',
    ])
    expect(classes(wrapper('hide-outside'))).toEqual([
      'greese-Visibility',
      'greese-Visibility--hide-below-sm',
      'greese-Visibility--hide-from-lg',
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
      'greese-Visibility--hide-below-lg mine'
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
    expect(html).toContain('greese-Stack--md-direction-row')
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
