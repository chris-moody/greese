# greese.js (`@greese-ui/greese`)

A small keyframe and timeline animation library for the web: about 5 kB
(brotli), no dependencies, no framework.

- **Keyframe-based**, WAAPI-style: `{ opacity: [0, 1] }` or frames with
  `offset` and `ease`.
- **Timelines** that play, pause, seek, reverse, scale time, repeat, yoyo and
  **nest**.
- Animates **CSS properties, individual transforms, custom properties, text,
  SVG attributes and plain objects**.
- **Stagger**, **`splitText`** (accessible), GSAP-style **eases** and
  **positions**.
- **Respects `prefers-reduced-motion`** by default.

```bash
npm install @greese-ui/greese
```

It ships with [`@greese-ui/react`](../react), which re-exports it, so GreeseUI
users already have it.

```ts
import { animate, timeline, splitText } from '@greese-ui/greese'

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

|           |                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build     | `.to`, `.from`, `.fromTo`, `.animate` (keyframes), `.set`, `.add` (timeline or callback), `.call`, `.label`                                                                                 |
| Control   | `play`, `pause`, `resume`, `reverse`, `restart`, `seek`, `progress`, `time`, `timeScale`, `kill`, `invalidate`, `await`                                                                     |
| Options   | `paused`, `repeat`, `yoyo`, `repeatDelay`, `timeScale`, `reducedMotion`, `onUpdate`, `onComplete`                                                                                           |
| Positions | `1.5`, `'+=0.2'`, `'-=0.2'`, `'<'`, `'>-0.1'`, `'label+=0.5'`                                                                                                                               |
| Eases     | `'out'` (default), `'power1'`–`'power4'`, `'sine'`, `'expo'`, `'circ'`, `'back'`, `'elastic'`, `'bounce'` with `.in`/`.out`/`.inOut`; CSS names; `steps(n)`; cubic-bézier arrays; functions |

Times are seconds. Transforms use the individual CSS `translate`, `rotate` and
`scale` properties, so they never fight your CSS `transform`. Colours mix in
OKLab.

Full guide: **Guides/Animation** in the GreeseUI docs. Design decisions:
[ADR 0008](../../docs/adr/0008-greese-js-animation.md).

MIT licensed.
