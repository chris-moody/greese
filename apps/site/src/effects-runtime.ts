import { defineGreeseEffect, removeGreeseEffect } from '@greese/react'
import { keyframesCss } from './studio/effectCss.ts'
import { CSS_PRESETS, type EffectSpec } from './studio/spec.ts'

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/** The effect names last applied, so one dropped from the theme is forgotten. */
let applied = new Set<string>()

/**
 * Puts a theme's effects to work on this page: each is defined for the
 * runtime (sequences, interactions), and a retuned CSS preset gets its
 * `@keyframes` in a style element, since this page doesn't load the theme's
 * compiled CSS. (The studio's preview does, and only needs the definitions.)
 */
export const applyEffects = (
  effects: Record<string, EffectSpec> | undefined,
  { css = true }: { css?: boolean } = {}
): void => {
  const next = new Set(Object.keys(effects ?? {}))
  for (const name of applied) if (!next.has(name)) removeGreeseEffect(name)
  for (const [name, effect] of Object.entries(effects ?? {}))
    defineGreeseEffect(
      name,
      effect.duration === undefined
        ? { keyframes: effect.keyframes }
        : { keyframes: effect.keyframes, duration: effect.duration }
    )
  applied = next
  if (!css || typeof document === 'undefined') return
  const rules = (CSS_PRESETS as readonly string[])
    .filter((name) => effects?.[name])
    .map((name) => keyframesCss(`greese-${kebab(name)}`, effects![name]!.keyframes))
  let style = document.getElementById('greese-theme-effects') as HTMLStyleElement | null
  if (!rules.length) return style?.remove()
  if (!style) {
    style = document.createElement('style')
    style.id = 'greese-theme-effects'
    document.head.append(style)
  }
  style.textContent = `@layer greese.utilities {\n${rules.join('\n')}\n}`
}
