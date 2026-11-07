import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  createAuthoringEnvironment,
  MarkerPanel,
  timelineActions,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

/** A marker on frame 12, selected. */
const marked = () => {
  const env = createAuthoringEnvironment()
  env.store.dispatch(
    timelineActions.addMarker({ scope: 'root', frame: 12, label: 'Bounce' })
  )
  const marker = env.store.getState().timeline.markers[0]!
  env.store.dispatch(timelineActions.setMarkerSelection([marker.id]))
  return env
}

const meta = {
  title: 'Authoring/MarkerPanel',
  component: MarkerPanel,
} satisfies Meta<typeof MarkerPanel>
export default meta

type Story = StoryObj<typeof meta>

/** The selected marker's name and frame. */
export const Playground: Story = {
  render: function Playground() {
    const [env] = useState(marked)
    return (
      <env.Provider>
        <div style={{ maxInlineSize: '20rem' }}>
          <MarkerPanel />
        </div>
      </env.Provider>
    )
  },
}
