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
import { Grid } from './Grid/Grid.tsx'
import { Tile } from './Tile/Tile.tsx'
import { Spacer } from './Spacer/Spacer.tsx'
import { Stack } from './Stack/Stack.tsx'
import { Hide, Show } from './Visibility/Visibility.tsx'

const classes = (el: Element) => el.className.split(' ').sort()

describe('Box', () => {
  it('renders a plain div with no style when given no style props', () => {
    render(<Box data-testid="b" id="x" />)
    const box = screen.getByTestId('b')
    expect(box.tagName).toBe('DIV')
    expect(box).toHaveClass('greese-Box')
    expect(box.className).not.toMatch(/--/) // no modifiers
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
        'greese-Box--md-display-block',
        'greese-Box--md-p',
        'greese-Box--xs-display-none',
        'greese-Box--xs-max-w',
        'greese-Box--xs-mx',
        'greese-Box--xs-p',
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
    expect(section).toHaveClass('greese-Box', 'greese-Box--xs-p')
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
        'greese-Box--xs-p',
        'greese-Stack',
        'greese-Stack--lg-gap',
        'greese-Stack--md-direction-row',
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

describe('Grid', () => {
  it('is a grid with `container`: columns to classes, templates and widths to variables', () => {
    render(
      <Grid
        data-testid="g"
        container
        columns={{ xs: 1, md: '200px 1fr' }}
        minChildWidth={{ lg: '14rem' }}
        gap={4}
        containerQueries
      >
        <Grid data-testid="i" size={{ xs: 'full', md: 6 }} />
      </Grid>
    )
    const grid = screen.getByTestId('g')
    expect(grid).toHaveClass(
      'greese-Grid',
      'greese-Grid--container',
      'greese-Grid--queries',
      'greese-Grid--xs-columns-1',
      'greese-Grid--md-columns',
      'greese-Grid--lg-min-child',
      'greese-Grid--xs-gap-4'
    )
    expect(grid.style.getPropertyValue('--greese-grid-columns-md')).toBe('200px 1fr')
    expect(grid.style.getPropertyValue('--greese-grid-min-child-lg')).toBe('14rem')
  })

  it('is a cell without `container`, spanning `size` columns', () => {
    render(<Grid data-testid="i" size={{ xs: 'full', md: 6 }} columns={3} gap={2} />)
    const cell = screen.getByTestId('i')
    expect(cell).toHaveClass(
      'greese-Grid',
      'greese-Grid--xs-size-full',
      'greese-Grid--md-size-6'
    )
    // Grid props only apply to grids.
    expect(cell).not.toHaveClass('greese-Grid--container')
    expect(cell.className).not.toMatch(/columns|gap/)
  })

  it('can be a cell and a grid at once, to nest', () => {
    render(<Grid data-testid="n" container size={8} columns={2} />)
    expect(screen.getByTestId('n')).toHaveClass(
      'greese-Grid--container',
      'greese-Grid--xs-size-8',
      'greese-Grid--xs-columns-2'
    )
  })
})

describe('Tile', () => {
  it('is a Box with a surface, taking style props and asChild', () => {
    render(
      <Tile data-testid="t" variant="dashed" p={6} asChild>
        <section aria-label="Drop zone">Drop files here</section>
      </Tile>
    )
    const tile = screen.getByRole('region', { name: 'Drop zone' })
    expect(tile).toBe(screen.getByTestId('t'))
    expect(tile).toHaveClass('greese-Tile', 'greese-Tile--dashed', 'greese-Box')
    expect(tile.style.getPropertyValue('--greese-box-p-xs')).toBe('var(--greese-space-6)')
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
    expect(spacer).toHaveClass(
      'greese-Spacer',
      'greese-Spacer--fixed',
      'greese-Spacer--xs-size',
      'greese-Spacer--md-size'
    )
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
          <Grid container columns={2}>
            <Grid size={2} />
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
            <Grid container minChildWidth="10rem" gap={2}>
              <Tile>one</Tile>
              <Tile>two</Tile>
            </Grid>
            <AspectRatio ratio={16 / 9}>
              <img src="data:," alt="Placeholder" />
            </AspectRatio>
            <Spacer size={2} />
            <Center>
              <p>Centred</p>
            </Center>
          </Stack>
        </main>
      </Container>
    )
    await expectNoAxeViolations(container)
  })
})
