/**
 * Runs `fn` once the page has loaded and the browser is idle (or after
 * `timeout` ms at most), so work that can wait never competes with the first
 * screen for the network or the main thread. Returns a cancel.
 */
export const whenIdle = (fn: () => void, timeout = 4000): (() => void) => {
  let cancel = () => {}
  const ready = () => {
    if ('requestIdleCallback' in window) {
      const handle = requestIdleCallback(fn, { timeout })
      cancel = () => cancelIdleCallback(handle)
    } else {
      const handle = setTimeout(fn, Math.min(timeout, 1500))
      cancel = () => clearTimeout(handle)
    }
  }
  if (document.readyState === 'complete') ready()
  else addEventListener('load', ready, { once: true })
  return () => {
    removeEventListener('load', ready)
    cancel()
  }
}
