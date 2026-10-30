/**
 * The page's entry: the first screen's CSS, render-blocking, and nothing
 * else that runs before the first paint. Module scripts run before the
 * browser first paints, so the app's JavaScript imported here was on the way
 * to the homepage's first paint: about 120 kB before it, and 150 kB once the
 * router came (ADR 0030). On the prerendered homepage it's requested once
 * the first screen has painted instead (boot.tsx), while its CSS entrances
 * play.
 */
import '@greese/react/base.css'
// Render-blocking: only what the first screen uses. The rest is library.ts.
import './styles/firstScreen.ts'
import 'virtual:greese-utilities.css'
import './site.scss'

/** A task of its own for what follows. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve))

let started = false
const boot = () => {
  if (started) return
  started = true
  // Evaluating the app's modules is a long task (about 90 ms on a slow
  // phone, 23 ms here) if it all happens at once: React, then React Router,
  // then greese ui and the app, each in a task of its own, stay short.
  void import('react-dom/client')
    .then(nextTask)
    .then(() => import('react-router'))
    .then(nextTask)
    .then(() => import('./boot.tsx'))
}

/** A few frames after `fn`'s turn comes, then a task: the frames are presented. */
const afterFrames = (frames: number, fn: () => void) => {
  const tick = () => (--frames > 0 ? requestAnimationFrame(tick) : setTimeout(fn))
  requestAnimationFrame(tick)
}

/**
 * The first screen's entrances that start at once (the hero's text, which is
 * the page's largest paint), finished. A browser counts a fading element's
 * paint only once it has faded part of the way in, so script that arrives
 * before then competes with it. Delayed and endless animations don't count;
 * under reduced motion the durations collapse and this is at once.
 */
const entrancesDone = (): Promise<unknown> =>
  Promise.all(
    document
      .getAnimations()
      .filter((a) => {
        const timing = a.effect?.getComputedTiming()
        return timing && !timing.delay && timing.iterations !== Infinity
      })
      .map((a) => a.finished.catch(() => {}))
  )

// Only the prerendered homepage has a first screen to wait for: a route
// that arrives empty (the studio, the docs) starts at once.
if (!document.getElementById('root')?.firstElementChild) boot()
else if (PerformanceObserver.supportedEntryTypes?.includes('paint')) {
  // After the first contentful paint has been presented (a frame callback
  // alone runs before its frame is: on a slow phone the scripts were then
  // requested before the paint they should follow), and its entrances.
  new PerformanceObserver((list, observer) => {
    if (!list.getEntriesByName('first-contentful-paint').length) return
    observer.disconnect()
    void entrancesDone().then(() => afterFrames(1, boot))
  }).observe({ type: 'paint', buffered: true })
} else afterFrames(1, boot)
// A tab opened in the background paints no frames: it starts when it's
// shown. Otherwise nothing waits longer than this. It was 1 s, but a first
// frame can take that long to be presented (Lighthouse's runs did, half the
// time), and booting before the first paint put the app's script in front of
// it (ADR 0030).
if (document.visibilityState === 'hidden')
  document.addEventListener('visibilitychange', boot, { once: true })
setTimeout(boot, 3000)
