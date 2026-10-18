// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { dependenciesOf, ownersOf, type ComponentSource } from './cssGraph.ts'

const component = (name: string, tsx: string, hasScss = true): ComponentSource => ({
  name,
  tsx,
  hasScss,
})

describe('ownersOf', () => {
  it('prefers the component named after the block, else the only definer', () => {
    const owners = ownersOf(
      new Map([
        ['Button', '.sauce-Button { } .sauce-Button--solid { }'],
        ['ButtonGroup', '.sauce-ButtonGroup > .sauce-Button { }'],
        ['ChoiceGroup', '.sauce-Checkbox, .sauce-Radio { } .sauce-Checkbox-box { }'],
        ['Checkbox', '.sauce-Checkbox-input { }'],
      ])
    )
    expect(owners.get('sauce-Button')).toBe('Button')
    expect(owners.get('sauce-Checkbox')).toBe('ChoiceGroup')
    expect(owners.get('sauce-Checkbox-box')).toBe('ChoiceGroup')
    expect(owners.get('sauce-Checkbox-input')).toBe('Checkbox')
  })
})

describe('dependenciesOf', () => {
  const compiled = new Map([
    ['Button', '.sauce-Button { }'],
    ['IconButton', '.sauce-IconButton { }'],
    ['Dialog', '.sauce-Dialog { } .sauce-Dialog-title { }'],
    ['VisuallyHidden', '.sauce-VisuallyHidden { }'],
  ])

  it('follows imports and class references, skipping components with no styles', () => {
    const { deps, unresolved } = dependenciesOf(
      [
        component('Slot', 'export const Slot = 1', false),
        component(
          'Button',
          "import { Slot } from '../Slot/Slot.tsx'; cx('sauce-Button', `sauce-Button--${v}`)"
        ),
        component(
          'IconButton',
          "import { Button } from '../Button/Button.tsx'; 'sauce-IconButton'"
        ),
        component(
          'Dialog',
          "import { IconButton } from '../IconButton/IconButton.tsx'\nimport { Slot } from '../Slot/Slot.tsx'\n'sauce-Dialog-title', hide && 'sauce-VisuallyHidden'"
        ),
        component('TextField', "import { Button } from '../Button/Button.tsx'", false),
      ],
      compiled
    )
    expect(unresolved).toEqual([])
    expect(deps.get('Button')).toEqual([])
    expect(deps.get('IconButton')).toEqual(['Button'])
    expect(deps.get('Dialog')).toEqual(['IconButton', 'VisuallyHidden'])
    // No styles of its own, but it needs Button's: it still gets a stylesheet.
    expect(deps.get('TextField')).toEqual(['Button'])
  })

  it('reports classes whose block no stylesheet defines', () => {
    const { unresolved } = dependenciesOf([component('Typo', "'sauce-Buton'")], compiled)
    expect(unresolved).toEqual([{ component: 'Typo', cls: 'sauce-Buton' }])
  })
})
