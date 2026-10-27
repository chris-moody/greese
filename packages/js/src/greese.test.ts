import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  animate,
  batch,
  cubicBezier,
  ease,
  mix,
  parseColor,
  splitText,
  timeline,
  fromPixels,
  type PixelsAnimation,
  type PixelsKeyframe,
} from './index.ts'
import { mixText } from './value.ts'

const flushMicrotasks = () => Promise.resolve()

describe('ease', () => {
  it('resolves names, beziers and functions', () => {
    expect(ease('linear')(0.3)).toBe(0.3)
    expect(ease('power1.in')(0.5)).toBeCloseTo(0.25)
    expect(ease('in')(0.5)).toBeCloseTo(0.125) // power2
    expect(ease('out')(0.5)).toBeCloseTo(0.875)
    expect(ease('power2.inOut')(0.25)).toBeCloseTo(0.0625)
    expect(ease('power2.inOut')(0.75)).toBeCloseTo(0.9375)
    expect(ease('steps(4)')(0.3)).toBe(0.25)
    expect(ease([0, 0, 1, 1])(0.4)).toBeCloseTo(0.4)
    expect(ease((t) => t * t)(0.5)).toBe(0.25)
    for (const name of [
      'back.out(2)',
      'elastic.out(1.2, 0.4)',
      'bounce.inOut',
      'expo.out',
      'ease-in-out',
    ]) {
      const f = ease(name)
      expect(f(0)).toBeCloseTo(0)
      expect(f(1)).toBeCloseTo(1)
    }
    expect(ease('back.out')(0.5)).toBeGreaterThan(1) // overshoots
    expect(() => ease('wobble.out')).toThrow(/unknown ease/)
  })

  it('matches CSS ease at its midpoint', () => {
    expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(0.8024, 3)
  })

  it('reads CSS cubic-bezier() strings, as tokens and computed styles write them', () => {
    expect(ease('cubic-bezier(0.25, 0.1, 0.25, 1)')(0.5)).toBeCloseTo(0.8024, 3)
    expect(ease('cubic-bezier(0,0,1,1)')(0.4)).toBeCloseTo(0.4)
  })
})

describe('mix', () => {
  it('reads the color forms browsers compute: oklab(), oklch() and color(srgb)', () => {
    const near = (input: string, expected: number[]) =>
      parseColor(input)!.forEach((v, i) => expect(v).toBeCloseTo(expected[i]!, 0))
    // As Chrome computes color-mix(in oklab, red 50%, blue), and Firefox's
    // canvas converts it: #8c53a2.
    near('oklab(0.539974 0.0962086 -0.0928316)', [140, 83, 162, 1])
    near('oklch(0.7 0.1 200)', [64, 177, 183, 1])
    near('color(srgb 0.5 0 0.5 / 0.5)', [127.5, 0, 127.5, 0.5])
    expect(parseColor('color(display-p3 1 0 0)')).toBeUndefined()
  })

  it('blends between those forms and rgb() instead of switching halfway', () => {
    const halfway = mix('rgb(255, 0, 0)', 'color(srgb 0 0 1)')(0.5)
    expect(halfway).toMatch(/^rgb\(\d+ \d+ \d+ \/ 1\)$/)
    expect(halfway).not.toBe('color(srgb 0 0 1)')
  })

  it('interpolates numbers, units and number-shaped strings', () => {
    expect(mix(0, 10)(0.25)).toBe(2.5)
    expect(mix('10px', '30px')(0.5)).toBe('20px')
    expect(mix('0', '12rem')(0.5)).toBe('6rem')
    expect(mix('blur(0px) brightness(1)', 'blur(8px) brightness(2)')(0.5)).toBe(
      'blur(4px) brightness(1.5)'
    )
    expect(mix(0.1, 0.2)(1)).toBe(0.2) // no float noise
  })

  it('blends different units with calc(), exact at both ends', () => {
    const radius = mix('16px', '2rem')
    expect(radius(0)).toBe('16px')
    expect(radius(0.25)).toBe('calc(16px * 0.75 + 2rem * 0.25)')
    expect(radius(1)).toBe('2rem')
    expect(mix('100px', '50vw')(0.5)).toBe('calc(100px * 0.5 + 50vw * 0.5)')
    expect(mix('0px', '50%')(0.5)).toBe('calc(0px * 0.5 + 50% * 0.5)')
    // Per number: same units interpolate, different ones blend.
    expect(mix('10px 20px', '1rem 40px')(0.5)).toBe('calc(10px * 0.5 + 1rem * 0.5) 30px')
    expect(mix('blur(4px)', 'blur(1rem)')(0.5)).toBe('blur(calc(4px * 0.5 + 1rem * 0.5))')
    // A bare number still takes the other end's unit.
    expect(mix('0', '50%')(0.5)).toBe('25%')
  })

  it('mixes colors in OKLab and keeps the ends exact', () => {
    expect(mix('#ff0000', 'rgb(0, 0, 255)')(0)).toBe('rgb(255 0 0 / 1)')
    expect(mix('#ff0000', 'rgb(0, 0, 255)')(1)).toBe('rgb(0 0 255 / 1)')
    expect(mix('#000', '#fff')(0.5)).toMatch(/^rgb\((\d+) \1 \1 \/ 1\)$/)
    expect(mix('transparent', '#fff')(0.5)).toMatch(/\/ 0\.5\)$/)
    expect(parseColor('rgb(10 20 30 / 50%)')).toEqual([10, 20, 30, 0.5])
  })

  it('switches discrete values, keeping shown values shown', () => {
    expect(mix('block', 'flex')(0.4)).toBe('block')
    expect(mix('block', 'flex')(0.6)).toBe('flex')
    expect(mix('none', 'block')(0.01)).toBe('block')
    expect(mix('block', 'none')(0.99)).toBe('block')
    expect(mix('block', 'none')(1)).toBe('none')
    expect(mix('auto', '50%')(0.6)).toBe('50%') // no number to blend from
  })

  it('counts, types and retypes text', () => {
    expect(mixText('0', '1000')(0.5)).toBe('500')
    expect(mixText('0', '9.99')(0.5)).toBe('5.00')
    expect(mixText('', 'Hello')(0.6)).toBe('Hel')
    expect(mixText('Hello', 'Help')(0.25)).toBe('Hel'.slice(0, 3)) // deleting first
    expect(mixText('Hello', 'Help')(1)).toBe('Help')
  })
})

describe('timeline on plain objects', () => {
  it('sequences, seeks and reports progress', () => {
    const o = { x: 0, y: 0 }
    const tl = timeline({ paused: true })
      .to(o, { x: 100, duration: 1, ease: 'linear' })
      .to(o, { y: 50, duration: 1, ease: 'linear' })
    expect(tl.duration()).toBe(2)
    tl.seek(0.5)
    expect(o).toEqual({ x: 50, y: 0 })
    tl.seek(1.5)
    expect(o).toEqual({ x: 100, y: 25 })
    tl.progress(1)
    expect(o).toEqual({ x: 100, y: 50 })
    // Seeking back restores values the later animation hadn't touched yet.
    tl.seek(0.25)
    expect(o).toEqual({ x: 25, y: 0 })
  })

  it('places children with positions and labels', () => {
    const o = { a: 0, b: 0, c: 0, d: 0 }
    const tl = timeline({ paused: true })
      .to(o, { a: 1, duration: 1 })
      .label('mid', 0.5)
      .to(o, { b: 1, duration: 1 }, '<') // with the previous start
      .to(o, { c: 1, duration: 1 }, 'mid+=1')
      .to(o, { d: 1, duration: 0.5 }, '>-0.25')
    expect(tl.duration()).toBe(2.75)
    tl.seek(1.6)
    expect(o.c).toBeGreaterThan(0)
    expect(o.d).toBe(0)
    tl.seek('mid')
    expect(tl.time()).toBe(0.5)
  })

  it('animates keyframe arrays with offsets and per-frame eases', () => {
    const o = { v: 0 }
    const tl = timeline({ paused: true }).animate(
      o,
      [{ v: 0, ease: 'linear' }, { v: 10, offset: 0.8, ease: 'linear' }, { v: 0 }],
      { duration: 1 }
    )
    tl.seek(0.4)
    expect(o.v).toBeCloseTo(5)
    tl.seek(0.8)
    expect(o.v).toBe(10)
    tl.seek(1)
    expect(o.v).toBe(0)
  })

  it('animates property-indexed keyframes, evenly spaced', () => {
    const o = { x: 0, y: 0 }
    timeline({ paused: true })
      .animate(o, { x: [0, 10, 0], y: [5, 15] }, { duration: 1, ease: 'linear' })
      .seek(0.5)
    expect(o).toEqual({ x: 10, y: 10 })
  })

  it('staggers targets, from either end or the centre', () => {
    const items = [{ v: 0 }, { v: 0 }, { v: 0 }]
    const tl = timeline({ paused: true }).to(items, {
      v: 1,
      duration: 1,
      ease: 'linear',
      stagger: { each: 0.5, from: 'center' },
    })
    expect(tl.duration()).toBe(1.5)
    tl.seek(0.5)
    expect(items.map((i) => i.v)).toEqual([0, 0.5, 0])
  })

  it('takes per-target values and staggers from functions', () => {
    const items = [{ v: 0 }, { v: 0 }, { v: 0 }]
    const seen: unknown[] = []
    const tl = timeline({ paused: true }).to(items, {
      v: (i, target, targets) => {
        seen.push([target === items[i], targets.length])
        return (i + 1) * 10
      },
      duration: 1,
      ease: 'linear',
      stagger: (i) => [1, 0, 0.5][i]!,
    })
    expect(seen).toEqual(Array(3).fill([true, 3]))
    expect(tl.duration()).toBe(2)
    tl.seek(1)
    expect(items.map((i) => i.v)).toEqual([0, 20, 15])
    const keyed = [{ x: 0 }, { x: 0 }]
    timeline({ paused: true })
      .animate(keyed, { x: [0, (i) => i + 1, 0] }, { duration: 1, ease: 'linear' })
      .seek(0.5)
    expect(keyed.map((k) => k.x)).toEqual([1, 2])
    const from = [{ y: 5 }, { y: 5 }]
    timeline({ paused: true }).fromTo(from, { y: (i) => i * 2 }, { y: 5, duration: 1 })
    expect(from.map((f) => f.y)).toEqual([0, 2])
  })

  it('shows from-values immediately and returns to the original', () => {
    const o = { v: 7 }
    const tl = timeline({ paused: true }).from(
      o,
      { v: 0, duration: 1, ease: 'linear' },
      1
    )
    expect(o.v).toBe(0)
    tl.seek(1.5)
    expect(o.v).toBe(3.5)
    tl.seek(2)
    expect(o.v).toBe(7)
  })

  it('repeats, delays and yoyos', () => {
    const o = { v: 0 }
    const tl = timeline({ paused: true, repeat: 2, repeatDelay: 0.5, yoyo: true }).to(o, {
      v: 10,
      duration: 1,
      ease: 'linear',
    })
    expect(tl.totalDuration()).toBe(4)
    tl.seek(1.25) // in the delay after play 1: holds the end
    expect(o.v).toBe(10)
    tl.seek(1.75) // play 2 runs backwards
    expect(o.v).toBe(7.5)
    tl.seek(3.5) // play 3 forwards again
    expect(o.v).toBe(5)
  })

  it('nests timelines through their own repeat and time scale', () => {
    const o = { v: 0 }
    const child = timeline({ repeat: 1 }).to(o, { v: 10, duration: 1, ease: 'linear' })
    child.timeScale(2) // 2 plays of 1s at double speed: 1s in the parent
    const parent = timeline({ paused: true }).add(child, 1)
    expect(parent.duration()).toBe(2)
    parent.seek(1.25)
    expect(o.v).toBe(5)
    parent.seek(1.75) // second play of the child
    expect(o.v).toBe(5)
    parent.seek(0.5) // before the child: original value back
    expect(o.v).toBe(0)
    expect(child.isActive()).toBe(false)
  })

  it('kills, restoring original values', () => {
    const o = { v: 3 }
    const tl = timeline({ paused: true }).to(o, { v: 10, duration: 1 })
    tl.progress(1)
    expect(o.v).toBe(10)
    tl.kill()
    expect(o.v).toBe(3)
  })

  it('matches selector strings inside its scope only', () => {
    const inside = document.createElement('div')
    const outside = document.createElement('div')
    inside.innerHTML = outside.innerHTML = '<i class="dot"></i>'
    document.body.append(inside, outside)
    timeline({ paused: true, scope: inside })
      .to('.dot', { opacity: 0.5, duration: 1 })
      .progress(1)
    expect(inside.querySelector('i')!.style.opacity).toBe('0.5')
    expect(outside.querySelector('i')!.style.opacity).toBe('')
    inside.remove()
    outside.remove()
  })

  it('holds every write in a batch until it ends, so reads come first', () => {
    const el = document.createElement('div')
    document.body.append(el)
    const seen: string[] = []
    batch(() => {
      timeline({ paused: true }).to(el, { opacity: 0.5, duration: 1 }).progress(1)
      seen.push(el.style.opacity)
    })
    expect(seen).toEqual([''])
    expect(el.style.opacity).toBe('0.5')
    el.remove()
  })

  it('restores values it never needed to read: explicit keyframes and fromTo', () => {
    const o = { a: 3, b: 4 }
    const tl = timeline({ paused: true })
      .animate(o, { a: [0, 10] }, { duration: 1 })
      .fromTo(o, { b: 0 }, { b: 10, duration: 1 })
    tl.progress(1)
    expect(o).toEqual({ a: 10, b: 10 })
    tl.kill()
    expect(o).toEqual({ a: 3, b: 4 })
  })
})

describe('playback', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('autoplays on the next frame, completes and resolves', async () => {
    const o = { v: 0 }
    const onComplete = vi.fn()
    const tl = animate(o, { v: [0, 10] }, { duration: 0.1, ease: 'linear', onComplete })
    await flushMicrotasks()
    expect(tl.isActive()).toBe(true)
    vi.advanceTimersByTime(50)
    expect(o.v).toBeGreaterThan(0)
    expect(o.v).toBeLessThan(10)
    vi.advanceTimersByTime(100)
    expect(o.v).toBe(10)
    expect(onComplete).toHaveBeenCalledOnce()
    await tl
    expect(tl.progress()).toBe(1)
  })

  it('pauses before the first frame when asked', async () => {
    const o = { v: 0 }
    const tl = timeline().to(o, { v: 10, duration: 0.1 })
    tl.pause()
    await flushMicrotasks()
    vi.advanceTimersByTime(200)
    expect(o.v).toBe(0)
  })

  it('reverses, and runs callbacks when passed but not when seeking', async () => {
    const o = { v: 0 }
    const cue = vi.fn()
    const tl = timeline({ paused: true })
      .to(o, { v: 10, duration: 0.2, ease: 'linear' })
      .call(cue, 0.1)
    tl.seek(0.15)
    expect(cue).not.toHaveBeenCalled()
    tl.reverse()
    vi.advanceTimersByTime(300)
    expect(o.v).toBe(0)
    expect(cue).toHaveBeenCalledOnce()
    tl.timeScale(2).play()
    vi.advanceTimersByTime(120) // 0.2s of timeline at double speed
    expect(o.v).toBe(10)
    expect(cue).toHaveBeenCalledTimes(2)
  })

  it('jumps to the end under reduced motion unless told not to', async () => {
    const matchMedia = vi.fn(() => ({ matches: true }))
    vi.stubGlobal('matchMedia', matchMedia)
    const o = { v: 0 }
    animate(o, { v: 10 }, { duration: 5 })
    await flushMicrotasks()
    expect(o.v).toBe(10)
    const p = { v: 0 }
    const tl = animate(p, { v: 10 }, { duration: 5, reducedMotion: 'ignore' })
    await flushMicrotasks()
    expect(tl.isActive()).toBe(true)
    tl.kill()
    vi.unstubAllGlobals()
  })
})

describe('elements', () => {
  it('writes individual transforms, styles, variables, text and attributes', () => {
    const el = document.createElement('div')
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    svg.setAttribute('r', '0')
    document.body.append(el, svg)
    timeline({ paused: true })
      .to(el, {
        x: 40,
        y: 10,
        rotate: 90,
        scale: 2,
        opacity: 0.5,
        width: 100,
        duration: 1,
        ease: 'linear',
      })
      .to(el, { '--glow': 1, text: '42', duration: 1, ease: 'linear' }, 0)
      .to(svg, { r: 20, duration: 1, ease: 'linear' }, 0)
      .seek(0.5)
    expect(el.style.translate).toBe('20px 5px')
    expect(el.style.rotate).toBe('45deg')
    expect(el.style.scale).toBe('1.5 1.5')
    expect(el.style.opacity).toBe('0.75')
    expect(el.style.getPropertyValue('--glow')).toBe('0.5')
    expect(el.textContent).toBe('21')
    expect(svg.getAttribute('r')).toBe('10')
  })

  it("doesn't write a style or attribute that's already at its value", async () => {
    const el = document.createElement('div')
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    svg.setAttribute('r', '0')
    document.body.append(el, svg)
    const tl = timeline({ paused: true })
      .to(el, { x: 40, opacity: 0.5, duration: 1, ease: 'linear' })
      .to(svg, { r: 20, duration: 1, ease: 'linear' }, 0)
      // Both hold still while something else moves.
      .to({ t: 0 }, { t: 1, duration: 1 })
    tl.seek(1.2)
    const mutations: MutationRecord[] = []
    const observer = new MutationObserver((records) => mutations.push(...records))
    observer.observe(document.body, { subtree: true, attributes: true })
    tl.seek(1.5)
    tl.seek(1.8)
    await flushMicrotasks()
    observer.disconnect()
    expect(mutations).toEqual([])
    expect(el.style.translate).toBe('40px')
    expect(svg.getAttribute('r')).toBe('20')
  })

  it('accepts selectors and lists', () => {
    document.body.innerHTML = '<i class="dot"></i><i class="dot"></i>'
    timeline({ paused: true }).set('.dot', { opacity: 0 }).seek(0)
    const dots = document.querySelectorAll<HTMLElement>('.dot')
    expect([...dots].map((d) => d.style.opacity)).toEqual(['0', '0'])
  })
})

describe('repeats, labels and restoring', () => {
  const passes = (options: Parameters<typeof timeline>[0], until: number) => {
    const calls: number[] = []
    const tl = timeline({ paused: true, ...options })
      .to({ x: 0 }, { x: 1, duration: 1, ease: 'linear' })
      .call(() => calls.push(tl.time()), 0.5)
    for (let t = 0; t <= until + 1e-9; t += 0.1) tl.render(t)
    return calls.length
  }

  it('calls a callback once per play-through, however many repeat', () => {
    expect(passes({ repeat: 2 }, 3)).toBe(3)
    // A frame that skips a whole repeat still passes its callback.
    const tl = timeline({ paused: true, repeat: 3 }).to({ x: 0 }, { x: 1, duration: 1 })
    let calls = 0
    tl.call(() => calls++, 0.5)
    tl.render(0.2)
    tl.render(2.9)
    expect(calls).toBe(3)
  })

  it('with yoyo, passes it on the way there and on the way back', () => {
    expect(passes({ repeat: 1, yoyo: true }, 2)).toBe(2)
  })

  it('seeks only to labels it has', () => {
    const tl = timeline({ paused: true }).to({ x: 0 }, { x: 1 }).label('mid', 0.25)
    expect(tl.seek('mid').time()).toBe(0.25)
    expect(() => tl.seek('mdi')).toThrow('no label "mdi"')
  })

  it('kill() takes off the inline styles it added and keeps ones that were there', () => {
    const el = document.createElement('div')
    el.style.color = 'red'
    document.body.append(el)
    const tl = timeline({ paused: true })
      .to(el, { opacity: 0, x: 20, color: 'rgb(0, 0, 255)', duration: 1 })
      .seek(1)
    expect(el.style.opacity).toBe('0')
    tl.kill()
    expect(el.style.opacity).toBe('')
    expect(el.style.translate).toBe('')
    expect(el.style.color).toBe('red')
  })

  it('two timelines on one element, killed newest first, leave it as it was', () => {
    const el = document.createElement('div')
    document.body.append(el)
    const first = timeline({ paused: true }).to(el, { opacity: 0.5, duration: 1 }).seek(1)
    const second = timeline({ paused: true }).to(el, { opacity: 0, duration: 1 }).seek(1)
    second.kill()
    first.kill()
    expect(el.style.opacity).toBe('')
  })

  it('invalidate() reads transforms set since, instead of writing old ones back', () => {
    const el = document.createElement('div')
    document.body.append(el)
    const tl = timeline({ paused: true }).to(el, { x: 10, duration: 1 }).seek(1)
    expect(el.style.translate).toBe('10px')
    tl.kill()
    el.style.translate = '0px 30px'
    timeline({ paused: true }).to(el, { x: 5, duration: 1 }).invalidate().seek(1)
    expect(el.style.translate).toBe('5px 30px')
  })
})

describe('splitText', () => {
  it('splits into characters per word and keeps one accessible copy', () => {
    const p = document.createElement('p')
    p.innerHTML = 'Hi <b>there</b>'
    const { elements, revert } = splitText(p)
    expect(elements.map((e) => e.textContent).join('')).toBe('Hithere')
    expect(p.querySelector('[aria-hidden="true"]')).not.toBeNull()
    expect(p.textContent).toContain('Hi there')
    revert()
    expect(p.innerHTML).toBe('Hi <b>there</b>')
    expect(splitText(p, { by: 'words' }).elements.map((e) => e.textContent)).toEqual([
      'Hi',
      'there',
    ])
  })
})

describe('fromPixels', () => {
  // Shaped like a Pixels symbol animation: 10 fps, keyframes + tweens.
  const animation: PixelsAnimation = {
    fps: 10,
    layers: [
      {
        id: 'body',
        timeline: {
          frames: [
            {
              id: 'a',
              frame: 0,
              kind: 'keyframe',
              values: { x: 0, rotation: 350, alpha: 0 },
            },
            {
              id: 'b',
              frame: 10,
              kind: 'keyframe',
              values: { x: 100, rotation: 10, alpha: 1 },
            },
            { id: 'c', frame: 20, kind: 'keyframe', values: { x: 50 } },
            { id: 's', frame: 0, kind: 'span', duration: 5 } as PixelsKeyframe,
          ],
          tweens: [
            { startKeyframeId: 'a', endKeyframeId: 'b', type: 'linear', enabled: true },
            // b → c has no tween: a hold until frame 20.
          ],
        },
      },
      {
        id: 'glow',
        channel: '--glow',
        timeline: {
          frames: [
            { id: 'g1', frame: 0, value: 0 },
            { id: 'g2', frame: 10, value: 1 },
          ],
          tweens: [{ startKeyframeId: 'g1', endKeyframeId: 'g2', type: 'easeInOut' }],
        },
      },
    ],
  }

  it('maps channels, frames to seconds, tweens to eases, and holds', () => {
    const body = { x: 0, rotate: 0, opacity: 1 }
    const glow = { '--glow': 0 }
    const tl = fromPixels(animation, { body, glow })
    expect(tl.duration()).toBe(2)
    tl.seek(0.5)
    expect(body.x).toBe(50)
    // Shortest arc: 350° → 10° goes through 360, not back through 180.
    expect(body.rotate).toBe(360)
    expect(body.opacity).toBe(0.5)
    expect(glow['--glow']).toBe(0.5) // ease-in-out is symmetric at the midpoint
    tl.seek(1.5)
    expect(body.x).toBe(100) // held: no tween from b to c
    tl.seek(2)
    expect(body.x).toBe(50)
  })

  it('loops like Pixels playback and skips layers without targets', () => {
    const tl = fromPixels({ ...animation, loop: true }, { body: { x: 0 } })
    expect(tl.totalDuration()).toBe(Infinity)
  })
})
