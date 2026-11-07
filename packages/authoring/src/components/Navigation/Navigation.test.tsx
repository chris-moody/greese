import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
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
} from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

const environments = [
  { value: 'graphics', label: 'Graphics', icon: <ImageIcon />, hue: 150 },
  { value: 'animation', label: 'Animation', icon: <FilmIcon />, hue: 260 },
  { value: 'sound', label: 'Sound', disabled: true },
] as const

describe('EnvironmentSelect', () => {
  it('is a menu button naming the current environment, tinted with its hue', async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <EnvironmentSelect
        value="graphics"
        options={environments}
        onValueChange={onValueChange}
      />
    )
    const trigger = screen.getByRole('button', { name: 'Environment: Graphics' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger.style.getPropertyValue('--greese-authoring-accent-hue')).toBe('150')
    expect(
      screen.getByRole('menuitem', { name: 'Graphics', hidden: true })
    ).toHaveAttribute('aria-current', 'true')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Animation', hidden: true }))
    expect(onValueChange).toHaveBeenCalledWith('animation')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sound', hidden: true }))
    expect(onValueChange).toHaveBeenCalledOnce()
    await expectNoAxeViolations(container)
  })
})

describe('NavHistory', () => {
  const entries = [
    { id: '1', label: 'Root' },
    { id: '2', label: 'Button' },
    { id: '3', label: 'Icon' },
  ]

  it('is off with nowhere to go back to', () => {
    render(<NavHistory entries={[]} onBack={() => {}} onJump={() => {}} />)
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'History' })).toBeDisabled()
  })

  it('goes back, and lists the newest places first', async () => {
    const onBack = vi.fn()
    const onJump = vi.fn()
    const { container } = render(
      <NavHistory entries={entries} onBack={onBack} onJump={onJump} limit={2} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledOnce()
    const rows = screen.getAllByRole('menuitem', { hidden: true })
    expect(rows.map((row) => row.textContent)).toEqual(['Icon', 'Button'])
    fireEvent.click(rows[1]!)
    expect(onJump).toHaveBeenCalledWith(1)
    await expectNoAxeViolations(container)
  })
})

describe('NavBar and AccentIcon', () => {
  it('puts the history, trail and end parts in order', () => {
    render(
      <NavBar
        history={<button type="button">Back</button>}
        trail={<span>Trail</span>}
        end={<button type="button">Environment</button>}
      />
    )
    const bar = screen.getByText('Trail').closest('.greese-NavBar')!
    expect([...bar.querySelectorAll('button, span')].map((el) => el.textContent)).toEqual(
      ['Back', 'Trail', 'Environment']
    )
  })

  it('sets the hue its icon is tinted with', () => {
    render(
      <AccentIcon hue={30} data-testid="accent">
        <FilmIcon />
      </AccentIcon>
    )
    const icon = screen.getByTestId('accent')
    expect(icon).toHaveClass('greese-AccentIcon')
    expect(icon.style.getPropertyValue('--greese-authoring-accent-hue')).toBe('30')
  })
})

describe('AuthoringBreadcrumbs accents', () => {
  it('marks each step with its icon and hue, after a leading step', async () => {
    const env = createAuthoringEnvironment()
    const accent = vi.fn((assetId: string | null) =>
      assetId ? { icon: <FilmIcon data-testid="film" />, hue: 260 } : { hue: 150 }
    )
    const back = vi.fn()
    const { container } = render(
      <env.Provider>
        <AuthoringBreadcrumbs
          showAtRoot
          accent={accent}
          leading={
            <button type="button" onClick={back}>
              Rig
            </button>
          }
        />
      </env.Provider>
    )
    const trail = screen.getByRole('navigation', { name: 'Subview trail' })
    expect(trail).toHaveTextContent('RigRoot')
    fireEvent.click(screen.getByRole('button', { name: 'Rig' }))
    expect(back).toHaveBeenCalledOnce()

    act(() => {
      env.store.dispatch(
        navigationActions.pushFrame({
          assetId: 'a',
          name: 'Walk',
          mode: NavMode.ISOLATED,
          parentLayers: env.store.getState().layers,
          stageTransform: null,
        })
      )
    })
    expect(accent).toHaveBeenCalledWith('a')
    expect(screen.getByTestId('film')).toBeInTheDocument()
    const steps = container.querySelectorAll<HTMLElement>('[data-accent]')
    expect(
      [...steps].map((s) => s.style.getPropertyValue('--greese-authoring-accent-hue'))
    ).toEqual(['150', '260'])
    await expectNoAxeViolations(container)
  })
})
