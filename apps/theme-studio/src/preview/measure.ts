/**
 * What the preview actually renders for every colour role, in both schemes,
 * so the editor shows the truth rather than its own guess: `color-mix()`,
 * `rgb()`, `oklch()`, alpha and `var()` references all resolve here, as the
 * browser resolves them for the components.
 */
import { color } from '@greese/ui'

/** `#rrggbb`, or `#rrggbbaa` when the colour isn't opaque. */
export type Measured = Record<string, string>

const kebab = (value: string): string =>
  value.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

const hex2 = (n: number) => n.toString(16).padStart(2, '0')

/** Any computed CSS colour as hex, through a canvas: one pixel, read back. */
export const toHex = (css: string, ctx: CanvasRenderingContext2D): string => {
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = '#000'
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  const rgb = `#${hex2(r!)}${hex2(g!)}${hex2(b!)}`
  return a === 255 ? rgb : `${rgb}${hex2(a!)}`
}

/**
 * Every colour role as the preview renders it, inside the theme being edited
 * (`data-greese-theme`, when it has a name) and each scheme. A probe per
 * role takes the role as its text colour; its computed colour is the answer.
 */
export const measureColors = (
  doc: Document,
  theme: string | undefined
): { light: Measured; dark: Measured } => {
  const canvas = doc.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const host = doc.createElement('div')
  host.hidden = true
  doc.body.append(host)
  const out = { light: {} as Measured, dark: {} as Measured }
  for (const scheme of ['light', 'dark'] as const) {
    const scope = doc.createElement('div')
    scope.dataset.greeseScheme = scheme
    if (theme) scope.dataset.greeseTheme = theme
    host.append(scope)
    const probes = Object.keys(color).map((role) => {
      const probe = doc.createElement('span')
      probe.style.color = `var(--greese-color-${kebab(role)})`
      scope.append(probe)
      return [role, probe] as const
    })
    for (const [role, probe] of probes)
      out[scheme][role] = toHex(getComputedStyle(probe).color, ctx)
  }
  host.remove()
  return out
}
