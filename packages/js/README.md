# greese.js (`@greese/js`)

A small keyframe and timeline animation library for the web: about 5.6 kB
(brotli), no dependencies, no framework.

- **Keyframe-based**, WAAPI-style: `{ opacity: [0, 1] }`, or frames with
  `offset` and `ease`.
- **Timelines** that play, pause, seek, reverse, scale time, repeat, yoyo and
  **nest**.
- Animates **CSS properties, individual transforms, custom properties, text,
  SVG attributes and plain objects**.
- **`delay`**, and **`killTweensOf`** to take a target back from whatever is
  animating it.
- **Stagger**, an accessible **`splitText`**, named **eases** and
  **positions**.
- **`fromPixels`** plays animation authored in the Pixels studio.
- **Respects `prefers-reduced-motion`** by default, and an app's own setting:
  an element inside `data-greese-motion="reduce"` jumps to its end
  (`prefersReducedMotion(el)` tells you the same).

## Install: pick your form

**npm, with any bundler (ESM, tree-shaken, typed):**

```bash
npm install @greese/js
```

```ts
import { animate, timeline } from '@greese/js'
```

**With greese ui:** `@greese/react` depends on it and re-exports `animate`,
`timeline`, `ease`, `cubicBezier` and `splitText`. It also adds a `greese`
prop on every component. There's nothing extra to install.

**From a CDN, as an ES module (no build step):**

```html
<script type="module">
  import { animate } from 'https://cdn.jsdelivr.net/npm/@greese/js@0.1/+esm'
  animate('h1', { opacity: [0, 1], y: [20, 0] })
</script>
```

**As a classic `<script>` (defines `window.greese`):**

```html
<script src="https://unpkg.com/@greese/js@0.1/dist/greese.global.js"></script>
<script>
  greese.animate('h1', { opacity: [0, 1], y: [20, 0] })
</script>
```

**In Node and on servers:** importing touches no DOM. Without an animation
frame, timelines don't play on their own; drive plain objects with
`seek()` or `progress()`, for tests or offline frame rendering.

## Use

```ts
import { animate, timeline, splitText } from '@greese/js'

// One call: plays on the next frame.
animate('.card', { opacity: [0, 1], y: [16, 0] }, { duration: 0.4, stagger: 0.05 })

// A timeline: build, nest, control.
const intro = timeline()
  .to('.title', { opacity: 1, y: 0, duration: 0.6 })
  .from('.card', { opacity: 0, y: 24, stagger: 0.08 }, '-=0.3')
  .label('ready')
  .to(':root', { '--brand-hue': 280, duration: 1 }, 'ready')

const page = timeline({ repeat: 1, yoyo: true }).add(intro).timeScale(1.5)
page.pause().progress(0.5).reverse() // play backwards from halfway
await page // resolves when it completes
```

In a framework, build the timeline after mount and `kill()` it on unmount;
`kill()` also restores what it animated. The guide has React, Vue, Svelte and
plain JavaScript examples.

Where you hold the target but not the timeline — a game loop reacting to a hit
on a sprite that's already recoiling — `killTweensOf(target)` stops whatever is
animating it, wherever that started, and leaves the timeline's other targets
running.

|            |                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build      | `.to`, `.from`, `.fromTo`, `.animate` (keyframes), `.set`, `.add` (timeline or callback), `.call`, `.label`                                                                                                      |
| Control    | `play`, `pause`, `resume`, `reverse`, `restart`, `seek`, `progress`, `time`, `timeScale`, `kill`, `revert`, `killTweensOf`, `invalidate`, `await`                                                                          |
| Options    | `paused`, `repeat`, `yoyo`, `repeatDelay`, `timeScale`, `reducedMotion`, `scope`, `onUpdate`, `onComplete`                                                                                                       |
| Positions  | `1.5`, `'+=0.2'`, `'-=0.2'`, `'<'`, `'>-0.1'`, `'label+=0.5'`                                                                                                                                                    |
| Eases      | `'out'` (default), `'power1'`–`'power4'`, `'sine'`, `'expo'`, `'circ'`, `'back'`, `'elastic'`, `'bounce'` with `.in`/`.out`/`.inOut`; CSS names and `cubic-bezier()`; `steps(n)`; cubic-bézier arrays; functions |
| Per target | Any value, and `stagger`, can be a function of the target's index, the target and the list: `{ y: (i) => i * 8, stagger: (i, el) => … }`                                                                         |
| Extras     | `killTweensOf(targets)`, `splitText(el, { by })`, `fromPixels(animation, targets)`, `ease(name)`, `mix(a, b)`, `batch(fn)` (start many animations: all read, then all write)                                     |

Times are seconds. Transforms use the individual CSS `translate`, `rotate` and
`scale` properties, so they never fight your CSS `transform`. Colors mix in
OKLab.

## Sizes (brotli)

| Entry                                       | Size   |
| ------------------------------------------- | ------ |
| `animate` / `timeline`                      | 5.9 kB |
| Everything (with `splitText`, `fromPixels`) | 6.8 kB |
| `ease` alone                                | 0.9 kB |
| `greese.global.js` (`<script>`)             | 7.3 kB |

Full guide: **Guides/greese.js** in the greese ui docs. Design decisions:
[ADR 0008](../../docs/adr/0008-greese-js-animation.md).

MIT licensed.
