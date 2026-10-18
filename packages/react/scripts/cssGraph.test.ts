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
        ['Button', '.greese-Button { } .greese-Button--solid { }'],
        ['ButtonGroup', '.greese-ButtonGroup > .greese-Button { }'],
        ['ChoiceGroup', '.greese-Checkbox, .greese-Radio { } .greese-Checkbox-box { }'],
        ['Checkbox', '.greese-Checkbox-input { }'],
      ])
    )
    expect(owners.get('greese-Button')).toBe('Button')
    expect(owners.get('greese-Checkbox')).toBe('ChoiceGroup')
    expect(owners.get('greese-Checkbox-box')).toBe('ChoiceGroup')
    expect(owners.get('greese-Checkbox-input')).toBe('Checkbox')
  })
})

describe('dependenciesOf', () => {
  const compiled = new Map([
    ['Button', '.greese-Button { }'],
    ['IconButton', '.greese-IconButton { }'],
    ['Dialog', '.greese-Dialog { } .greese-Dialog-title { }'],
    ['VisuallyHidden', '.greese-VisuallyHidden { }'],
  ])

  it('follows imports and class references, skipping components with no styles', () => {
    const { deps, unresolved } = dependenciesOf(
      [
        component('Slot', 'export const Slot = 1', false),
        component(
          'Button',
          "import { Slot } from '../Slot/Slot.tsx'; cx('greese-Button', `greese-Button--${v}`)"
        ),
        component(
          'IconButton',
          "import { Button } from '../Button/Button.tsx'; 'greese-IconButton'"
        ),
        component(
          'Dialog',
          "import { IconButton } from '../IconButton/IconButton.tsx'\nimport { Slot } from '../Slot/Slot.tsx'\n'greese-Dialog-title', hide && 'greese-VisuallyHidden'"
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
    const { unresolved } = dependenciesOf([component('Typo', "'greese-Buton'")], compiled)
    expect(unresolved).toEqual([{ component: 'Typo', cls: 'greese-Buton' }])
  })
})
