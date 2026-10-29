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

let started = false
const boot = () => {
  if (started) return
  started = true
  void import('./boot.tsx')
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
// A tab opened in the background paints no frames, and nothing waits
// longer than this: start anyway.
setTimeout(boot, 1000)
