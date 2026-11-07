import { describe, expect, it } from 'vitest'
import { attributeSpec, canContain, elementSpec, SVG_ELEMENTS } from './index.ts'

describe('the SVG schema', () => {
  it('covers SVG 2’s elements and every filter primitive', () => {
    for (const tag of [
      'svg',
      'g',
      'a',
      'switch',
      'defs',
      'symbol',
      'use',
      'image',
      'foreignObject',
      'rect',
      'circle',
      'ellipse',
      'line',
      'polyline',
      'polygon',
      'path',
      'text',
      'tspan',
      'textPath',
      'linearGradient',
      'radialGradient',
      'stop',
      'pattern',
      'clipPath',
      'mask',
      'marker',
      'filter',
      'style',
      'script',
      'view',
      'title',
      'desc',
      'metadata',
      'animate',
      'animateMotion',
      'animateTransform',
      'set',
      'mpath',
      'feBlend',
      'feColorMatrix',
      'feComponentTransfer',
      'feComposite',
      'feConvolveMatrix',
      'feDiffuseLighting',
      'feDisplacementMap',
      'feDropShadow',
      'feFlood',
      'feGaussianBlur',
      'feImage',
      'feMerge',
      'feMergeNode',
      'feMorphology',
      'feOffset',
      'feSpecularLighting',
      'feTile',
      'feTurbulence',
      'feFuncR',
      'feFuncG',
      'feFuncB',
      'feFuncA',
      'feDistantLight',
      'fePointLight',
      'feSpotLight',
    ])
      expect(SVG_ELEMENTS, tag).toContain(tag)
  })

  it('says what an element is, and where an editor shows it', () => {
    expect(elementSpec('g')).toMatchObject({
      category: 'container',
      role: 'folder',
      renders: true,
    })
    expect(elementSpec('path')).toMatchObject({
      category: 'shape',
      role: 'layer',
      renders: true,
    })
    expect(elementSpec('linearGradient')).toMatchObject({
      category: 'paint',
      role: 'library',
      renders: false,
    })
    expect(elementSpec('clipPath')).toMatchObject({ role: 'library', renders: false })
    expect(elementSpec('defs')).toMatchObject({ role: 'none', renders: false })
    expect(elementSpec('feGaussianBlur')).toMatchObject({
      category: 'filter',
      role: 'none',
    })
    expect(elementSpec('animate')).toMatchObject({ category: 'animation', role: 'none' })
    expect(elementSpec('marquee')).toBeUndefined()
  })

  it('types every attribute, the shared groups included', () => {
    expect(attributeSpec('rect', 'rx')).toEqual({ name: 'rx', type: 'length' })
    expect(attributeSpec('path', 'd')).toEqual({ name: 'd', type: 'pathData' })
    expect(attributeSpec('path', 'fill')).toEqual({
      name: 'fill',
      type: 'paint',
      presentation: true,
    })
    expect(attributeSpec('polygon', 'points')!.type).toBe('points')
    expect(attributeSpec('svg', 'viewBox')!.type).toBe('viewBox')
    expect(attributeSpec('use', 'href')!.type).toBe('href')
    expect(attributeSpec('g', 'transform')!.type).toBe('transform')
    expect(attributeSpec('circle', 'filter')!.type).toBe('url')
    expect(attributeSpec('stop', 'stop-color')!.type).toBe('color')
    expect(attributeSpec('path', 'stroke-linecap')).toEqual({
      name: 'stroke-linecap',
      type: 'enum',
      values: ['butt', 'round', 'square'],
      presentation: true,
    })
    expect(attributeSpec('feBlend', 'mode')!.values).toContain('multiply')
    expect(attributeSpec('feGaussianBlur', 'result')!.type).toBe('string')
    expect(attributeSpec('feFuncR', 'type')!.values).toContain('gamma')
    expect(attributeSpec('text', 'font-size')!.type).toBe('length')
    expect(attributeSpec('svg:rect', 'width')!.type).toBe('length')
    // An element's own attribute beats a group's: `fill` on <animate> is timing.
    expect(attributeSpec('animate', 'fill')!.values).toEqual(['freeze', 'remove'])
    // Shapes don't take text styles.
    expect(attributeSpec('rect', 'font-size')).toBeUndefined()
  })

  it('knows what may hold what', () => {
    expect(canContain('g', 'rect')).toBe(true)
    expect(canContain('svg', 'linearGradient')).toBe(true)
    expect(canContain('linearGradient', 'stop')).toBe(true)
    expect(canContain('linearGradient', 'rect')).toBe(false)
    expect(canContain('rect', 'title')).toBe(true)
    expect(canContain('rect', 'circle')).toBe(false)
    expect(canContain('text', '#text')).toBe(true)
    expect(canContain('g', '#text')).toBe(false)
    expect(canContain('filter', 'feOffset')).toBe(true)
    expect(canContain('feComponentTransfer', 'feFuncA')).toBe(true)
    expect(canContain('feDiffuseLighting', 'fePointLight')).toBe(true)
    expect(canContain('clipPath', 'g')).toBe(false)
    expect(canContain('foreignObject', 'div')).toBe(true)
    expect(canContain('custom', 'rect')).toBe(true)
  })
})
