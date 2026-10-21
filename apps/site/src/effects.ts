import { defineGreeseEffect } from '@greese/react'

// The site's own effects, defined once at start-up and then used by name in
// `greese` props, alone or in sequences, like the built-in ones.
declare module '@greese/react' {
  interface GreeseEffectRegistry {
    wobble: true
    growX: true
  }
}

defineGreeseEffect('wobble', {
  keyframes: { rotate: [0, -6, 5, -3, 0] },
  duration: 0.6,
})

/** Bars grow from their start edge (the chart sets `transform-origin`). */
defineGreeseEffect('growX', {
  keyframes: { scaleX: [0, 1] },
  duration: 0.8,
  ease: 'power3.out',
})
