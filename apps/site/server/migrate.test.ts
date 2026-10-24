import { describe, expect, it } from 'vitest'
import { migrateSpec } from '../src/studio/migrate.ts'

describe('stored themes from before themes reassigned roles', () => {
  it('drop what the old layer presets overwrote, and keep the rest', () => {
    const old = {
      tokens: {
        radius: { sm: '0', md: '0', lg: '0', pill: '0', round: '0' },
        duration: { fast: '110ms', normal: '240ms', slow: '380ms' },
        easing: {
          standard: 'cubic-bezier(0.2, 0, 0, 1)',
          enter: 'cubic-bezier(0.2, 0.9, 0.1, 1)',
          exit: 'cubic-bezier(0.4, 0, 1, 1)',
        },
        space: { '4': '1.1rem' },
      },
      motionDefaults: { duration: '0.55s', distance: '1.25rem', stagger: '0.05s' },
      effects: {
        fadeUp: { keyframes: { opacity: [0, 1] } },
        mine: { keyframes: { opacity: [0, 1] } },
      },
      components: {
        Dialog: { motion: { enter: 'pocket-up', exit: 'pocket-out-down' } },
        TabPanel: {
          scss: '&:not(.greese-Motion) > * {\n  animation-name: greese-pocket-up;\n}',
        },
        Card: { styles: { gap: '0' } },
      },
    }
    expect(migrateSpec(old)).toEqual({
      tokens: { space: { '4': '1.1rem' } },
      effects: { mine: { keyframes: { opacity: [0, 1] } } },
      components: { Card: { styles: { gap: '0' } } },
    })
  })

  it('leave a theme of today as it is', () => {
    const today = {
      tokens: { radius: { md: '12px' } },
      motionDefaults: { theme: 'pocket-up' },
    }
    expect(migrateSpec(today)).toEqual(today)
  })
})
