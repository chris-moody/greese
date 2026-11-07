import { useMemo, type JSX } from 'react'
import {
  createAuthoringEnvironment,
  layersActions,
  makeLayer,
  playbackActions,
  Timeline,
} from '@greese/authoring'
import '@greese/react/base.css'
import '@greese/react/styles.css'
import '@greese/authoring/styles.css'

/** @greese/authoring's Timeline for e2e/authoring-timeline.spec.ts: 24 frames at 24 fps. */
export const AuthoringTimeline = (): JSX.Element => {
  const env = useMemo(() => {
    const e = createAuthoringEnvironment()
    e.store.dispatch(playbackActions.setFrameCount(24))
    e.store.dispatch(playbackActions.setLoop(false))
    const layer = makeLayer({ name: 'Ball' })
    e.store.dispatch(layersActions.addLayer({ layer }))
    e.store.dispatch(layersActions.addKeyframe({ layerId: layer.id, frame: 0, value: 0 }))
    return e
  }, [])
  return (
    <main style={{ blockSize: '100dvh', padding: '0.5rem', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: '1rem' }}>Timeline</h1>
      <env.Provider>
        <div style={{ blockSize: 240 }}>
          <Timeline hideMute />
        </div>
      </env.Provider>
    </main>
  )
}
