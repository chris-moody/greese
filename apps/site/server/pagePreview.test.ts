import { describe, expect, it } from 'vitest'
import { pageRoleVars, pageRules } from '../src/studio/pagePreview.ts'

describe('page transitions in the editor (ADR 0029)', () => {
  it('writes the page roles as motion-defaults() does', () => {
    expect(
      pageRoleVars({
        motionDefaults: {
          theme: 'fade-up',
          page: 'pocket-up',
          'page-exit': 'none',
          'page-duration': 'slow',
          'share-duration': '300ms',
          'page-ease': 'enter',
          'share-ease': 'cubic-bezier(0.2, 0, 0, 1)',
          'page-exit-order': 'together',
        },
      })
    ).toEqual({
      '--greese-motion-page': 'greese-pocket-up',
      '--greese-motion-page-exit': 'none',
      '--greese-motion-page-duration': 'var(--greese-duration-slow)',
      '--greese-motion-share-duration': '300ms',
      '--greese-motion-page-ease': 'var(--greese-easing-enter)',
      '--greese-motion-share-ease': 'cubic-bezier(0.2, 0, 0, 1)',
      '--greese-motion-page-exit-order': 'together',
    })
  })

  it('hands the page rules to PageTransition', () => {
    expect(
      pageRules({
        pageRules: {
          header: 'still',
          '.greese-Card': {
            exit: 'scale-out',
            enter: 'pop-in',
            duration: '300ms',
            delay: '0.05s',
          },
          main: { exit: 'none', duration: 'fast' },
        },
      })
    ).toEqual({
      header: 'still',
      '.greese-Card': { exit: 'scaleOut', enter: 'popIn', duration: 0.3, delay: 0.05 },
      main: { exit: 'none', duration: 'fast' },
    })
  })
})
