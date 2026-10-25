import { describe, expect, it } from 'vitest'
import { runtimeCycle } from './runtimeChunk.ts'

describe('runtimeChunkGuard', () => {
  const RUNTIME = '\0rolldown/runtime.js'

  it('finds the cycle that left the page blank', () => {
    expect(
      runtimeCycle({
        'effects.js': { imports: ['greese.js'], modules: [RUNTIME, '/src/effects.ts'] },
        'greese.js': { imports: ['react.js'], modules: ['/packages/react/x.js'] },
        'react.js': {
          imports: ['effects.js'],
          modules: ['/node_modules/react/index.js'],
        },
      })
    ).toEqual(['effects.js', 'greese.js', 'react.js', 'effects.js'])
  })

  it('passes when the runtime chunk is on no cycle', () => {
    expect(
      runtimeCycle({
        'react.js': { imports: [], modules: [RUNTIME, '/node_modules/react/index.js'] },
        'greese.js': { imports: ['react.js'], modules: [] },
        'index.js': { imports: ['greese.js', 'react.js'], modules: [] },
        // A cycle elsewhere is fine: it doesn't hold the helpers.
        'a.js': { imports: ['b.js'], modules: [] },
        'b.js': { imports: ['a.js'], modules: [] },
      })
    ).toBeUndefined()
    expect(runtimeCycle({ 'index.js': { imports: [], modules: [] } })).toBeUndefined()
  })
})
