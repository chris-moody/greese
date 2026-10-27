import { G, G_BOX, STROKE } from './glyphs.ts'

/** The favicon: the logo's g in its gradient, on a tile of the rims' dark shade. */
export const faviconSvg = (stops: string[], tile: string): string => {
  const [x, y, size] = G_BOX.split(' ').map(Number) as [number, number, number]
  const gradient = stops
    .map(
      (color, i) =>
        `<stop offset="${+(i / (stops.length - 1)).toFixed(2)}" stop-color="${color}"/>`
    )
    .join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${G_BOX}">` +
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.22}" fill="${tile}"/>` +
    `<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="60" y1="180" x2="200" y2="420">${gradient}</linearGradient>` +
    `<path d="${G}" fill="none" stroke="url(#g)" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`
  )
}

/**
 * Keeps the tab's icon in the colors the page wears: the header wordmark's
 * gradient and rim, read back as the browser computes them, so the theme,
 * the color scheme and the system's scheme all reach it. Re-read (at most
 * once a frame) when the theme's styles, the theme root or the scheme
 * change. public/favicon.svg is the base theme's, until this runs.
 */
export const liveFavicon = (): (() => void) => {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.append(link)
  }
  let last = ''
  let frame = 0
  const update = () => {
    frame = 0
    const mark = document.querySelector('.site-wordmark-glyphs')
    if (!mark) return
    const stops = [...mark.querySelectorAll('stop')].map(
      (s) => getComputedStyle(s).stopColor
    )
    const rim = mark.querySelector('.site-logo-rim')
    if (!stops.length || !rim) return
    const svg = faviconSvg(stops, getComputedStyle(rim).stroke)
    if (svg === last) return
    last = svg
    link.type = 'image/svg+xml'
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
  }
  const schedule = () => (frame ||= requestAnimationFrame(update))

  // Theme styles arrive in the head; the theme root and <html> carry the
  // theme's and the scheme's attributes.
  const observer = new MutationObserver(schedule)
  observer.observe(document.head, { childList: true, subtree: true, characterData: true })
  observer.observe(document.documentElement, { attributes: true })
  const site = document.querySelector('.site')
  if (site) observer.observe(site, { attributes: true })
  const dark = matchMedia('(prefers-color-scheme: dark)')
  dark.addEventListener('change', schedule)
  schedule()
  return () => {
    observer.disconnect()
    dark.removeEventListener('change', schedule)
    cancelAnimationFrame(frame)
  }
}
