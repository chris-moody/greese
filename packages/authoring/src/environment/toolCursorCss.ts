'use client'
/**
 * Rasterizes a tool icon into a CSS `cursor: url(...) x y, auto` value, for
 * an authoring shell's own PIXI backend to apply directly to its canvas
 * element. Every stage backend in this codebase (NeoPixels, Armature) owns
 * its canvas's `cursor` style completely — recomputing it every frame/pointer
 * event from live hover/drag state (see `neoPixelsPixiBackend.ts`'s
 * `setCursor`/ROTATE_CURSOR or `armaturePixiBackend.ts`'s `cursorFor`) — so a
 * custom cursor has to be fed into that same mechanism; a cursor drawn by an
 * external DOM overlay is always painted over by the backend's own next
 * `style.cursor` write.
 *
 * The icon itself renders as a MUI `SvgIcon` — i.e. its own `<svg>` — so
 * naively embedding the rendered element would nest an `<svg>` inside our
 * outer `<svg>`. Browsers' cursor-image decoders are far stricter than a
 * normal document renderer and don't reliably support that nesting (this
 * codebase's own working ROTATE_CURSOR/DS_REMOVE_CURSOR constants are both a
 * single flat `<svg>`, no nesting) — so the icon's own `<svg>` wrapper is
 * stripped and its inner markup spliced directly into our outer document,
 * with `fill`/`stroke` applied via inheritance from a wrapping `<g>` rather
 * than relying on the icon's `currentColor`/MUI stylesheet class, which
 * isn't available to a standalone cursor image anyway. A handful of custom
 * tool icons (e.g. `EllipseToolIcon`) draw themselves with an explicit
 * `stroke="currentColor"` rather than relying on the MUI stylesheet class —
 * that explicit attribute would otherwise win over our wrapper's inherited
 * `stroke`, so it's stripped too (its `fill="none"`/`stroke-width` are left
 * alone — those shape the glyph itself, e.g. Ellipse's hollow-outline look).
 *
 * A small arrow glyph marks the actual pointer hotspot (top-left), with the
 * tool icon offset below/right of it — the icon alone can't communicate
 * *where* the click lands, the way a native pointer's tip does. Both share
 * one thin white outline (for contrast against dark stage content) and one
 * soft drop shadow behind the whole assembly (for contrast against light
 * content) — a fixed, non-theme-reactive palette, matching this codebase's
 * other hand-authored cursor constants, since a rasterized cursor image
 * can't subscribe to theme changes.
 *
 * An optional second `badgeIcon` renders small, on a white disc, tucked into
 * the main icon's bottom-right corner (e.g. Paint Bucket's Shift-held
 * dual-fill-and-stroke indicator) — composed into the *same* single flat SVG
 * rather than layered separately, since (per the note above) the browser's
 * cursor-image decoder only reliably renders one flat image, not a DOM tree
 * of overlapping elements the way an on-page badge could be.
 */
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const SIZE = 40
/** Space reserved around the arrow tip for the drop shadow's blur to not clip — also the tip's (and hotspot's) coordinate. */
const MARGIN = 4
const ICON_SIZE = 16
/** How far below/right of the arrow tip the icon sits. */
const ICON_OFFSET = 8
const ARROW_SCALE = 0.72
/** A compact mouse-pointer silhouette, tip at local (0,0) — the point that lands exactly on the cursor hotspot once translated. */
const ARROW_PATH = 'M0,0 L0,16 L4.5,12.2 L7,18.5 L9.7,17.4 L7.2,11.2 L12.5,11.2 Z'
/** Screen-space diameter of the optional badge disc, tucked into the main icon's bottom-right corner. */
const BADGE_SIZE = 13

const svgInner = (icon: ReactNode): string | null => {
  if (!icon || !isValidElement(icon)) return null
  const markup = renderToStaticMarkup(icon as ReactElement)
  const innerMatch = markup.match(/^<svg[^>]*>([\s\S]*)<\/svg>$/)
  return (innerMatch?.[1] ?? '').replace(/\sstroke="currentColor"/g, '')
}

export const buildToolCursorCss = (icon: ReactNode, badgeIcon?: ReactNode): string => {
  const iconInner = svgInner(icon)
  if (iconInner === null) return 'default'

  const iconScale = ICON_SIZE / 24
  const iconX = MARGIN + ICON_OFFSET
  const iconY = MARGIN + ICON_OFFSET

  const badgeInner = svgInner(badgeIcon)
  let badgeMarkup = ''
  if (badgeInner !== null) {
    const badgeCx = iconX + ICON_SIZE - BADGE_SIZE * 0.4
    const badgeCy = iconY + ICON_SIZE - BADGE_SIZE * 0.4
    const badgeGlyphSize = BADGE_SIZE * 0.7
    const badgeScale = badgeGlyphSize / 24
    badgeMarkup =
      `<circle cx="${badgeCx}" cy="${badgeCy}" r="${BADGE_SIZE / 2}" fill="#fff" stroke="#1a1a1a" stroke-width="1"></circle>` +
      `<g transform="translate(${badgeCx - badgeGlyphSize / 2}, ${badgeCy - badgeGlyphSize / 2}) scale(${badgeScale})" fill="#1a1a1a" stroke="none">${badgeInner}</g>`
  }

  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<defs><filter id="cs" x="-60%" y="-60%" width="220%" height="220%">` +
    `<feDropShadow dx="0" dy="1" stdDeviation="1.1" flood-color="#000" flood-opacity="0.45"></feDropShadow>` +
    `</filter></defs>` +
    `<g filter="url(#cs)" fill="#1a1a1a" stroke="#fff" stroke-width="1.3" stroke-linejoin="round">` +
    `<path transform="translate(${MARGIN}, ${MARGIN}) scale(${ARROW_SCALE})" d="${ARROW_PATH}"></path>` +
    `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})">${iconInner}</g>` +
    `${badgeMarkup}` +
    `</g>` +
    `</svg>`

  return `url("data:image/svg+xml,${encodeURIComponent(markup)}") ${MARGIN} ${MARGIN}, auto`
}
