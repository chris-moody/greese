import { defineGreeseEffect } from '@greese-ui/react'

// The site's own effects, defined once at start-up and then used by name in
// `greese` props, alone or in sequences, like the built-in ones.
declare module '@greese-ui/react' {
  interface GreeseEffectRegistry {
    wobble: true
    growX: true
    float: true
    rise: true
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

defineGreeseEffect('float', { keyframes: { y: [0, -6] }, duration: 0.3 })

defineGreeseEffect('rise', ({ distance }) => ({
  opacity: [0, 1],
  y: [`calc(${distance} * 2)`, '0px'],
}))
