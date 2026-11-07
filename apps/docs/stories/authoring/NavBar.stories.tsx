import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { FilmIcon, ImageIcon } from '@greese/icons'
import {
  AccentIcon,
  AuthoringBreadcrumbs,
  createAuthoringEnvironment,
  EnvironmentSelect,
  NavBar,
  NavHistory,
  NavMode,
  navigationActions,
  type EnvironmentOption,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

const GRAPHICS = 150
const ANIMATION = 300

const environments: EnvironmentOption[] = [
  {
    value: 'graphics',
    label: 'Graphics',
    hue: GRAPHICS,
    icon: (
      <AccentIcon hue={GRAPHICS}>
        <ImageIcon />
      </AccentIcon>
    ),
  },
  {
    value: 'animation',
    label: 'Animation',
    hue: ANIMATION,
    icon: (
      <AccentIcon hue={ANIMATION}>
        <FilmIcon />
      </AccentIcon>
    ),
  },
]

/** An editor one symbol deep: a walk cycle opened from the root. */
const openedEnvironment = () => {
  const env = createAuthoringEnvironment()
  env.store.dispatch(
    navigationActions.pushFrame({
      assetId: 'walk',
      name: 'Walk cycle',
      mode: NavMode.ISOLATED,
      parentLayers: env.store.getState().layers,
      stageTransform: null,
    })
  )
  return env
}

const meta = {
  title: 'Authoring/NavBar',
  component: NavBar,
  subcomponents: { NavHistory, EnvironmentSelect },
} satisfies Meta<typeof NavBar>
export default meta

type Story = StoryObj<typeof meta>

/**
 * An editor's nav bar: Back and history, the trail with each step in its
 * environment's hue, and the environment picker at the end.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [env] = useState(openedEnvironment)
    const [environment, setEnvironment] = useState('animation')
    const [entries, setEntries] = useState([
      { id: 'root', label: 'Root' },
      { id: 'walk', label: 'Walk cycle' },
    ])
    return (
      <env.Provider>
        <NavBar
          {...args}
          history={
            <NavHistory
              entries={entries}
              onBack={() => setEntries(entries.slice(0, -1))}
              onJump={(index) => setEntries(entries.slice(0, index + 1))}
            />
          }
          trail={
            <AuthoringBreadcrumbs
              showAtRoot
              accent={(assetId) => ({
                hue: assetId ? ANIMATION : GRAPHICS,
                icon: assetId ? <FilmIcon /> : <ImageIcon />,
              })}
            />
          }
          end={
            <EnvironmentSelect
              value={environment}
              options={environments}
              onValueChange={setEnvironment}
            />
          }
        />
      </env.Provider>
    )
  },
}
