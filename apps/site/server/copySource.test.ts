import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { copySource } from '../src/studio/copySource.ts'
import { blocks } from '../src/studio/manifest.ts'
import { validateSpec } from '../src/studio/spec.ts'
import { compileSpec } from './studio.ts'

const COMPONENTS = join(process.cwd(), '../../packages/ui/src/components')

/** Motion writes the greese prop's presets with a partial that isn't public (`effect`); copying it into a theme would be meaningless. */
const NOT_COPYABLE = new Set(['Motion'])

describe('copying a component’s source into its SCSS box', () => {
  it('makes library paths pkg: URLs, drops the layer, and turns the component’s class into &', () => {
    const copied = copySource(
      `@use 'sass:map';
@use '../../styles/mixins';
@use '../../styles/tones';

@layer greese.components {
  .greese-Chip {
    @include mixins.component-root;
    padding: 0;

    &:hover { color: red; }
  }

  .greese-Chip--soft { gap: 0; }

  .greese-Chip-icon { opacity: 0.5; }

  @include tones.classes('greese-Chip', tone, (
    a: b,
  ));
}`,
      'greese-Chip'
    )
    expect(copied).toBe(`@use 'sass:map';
@use 'pkg:@greese/ui/scss/mixins';
@use 'pkg:@greese/ui/scss/tones';

& {
  @include mixins.component-root;
  padding: 0;

  &:hover { color: red; }
}

&.greese-Chip--soft { gap: 0; }

.greese-Chip-icon { opacity: 0.5; }

// tones.classes(…) left out: it writes the library's own classes`)
  })

  it('turns the class into & only where the rule isn’t inside another rule', () => {
    const copied = copySource(
      `.greese-Avatar { &:has(> .greese-Avatar) { gap: 0; } }
// about .greese-Avatar
@include mixins.up(md) {
  .greese-Avatar--lg, .greese-Group .greese-Avatar { gap: 1px; }
}
.greese-Group-item {
  > .greese-Avatar { content: '{'; }
  #{'.x'} .greese-Avatar { gap: 2px; }
}`,
      'greese-Avatar'
    )
    expect(copied).toBe(`& { &:has(> .greese-Avatar) { gap: 0; } }
// about .greese-Avatar
@include mixins.up(md) {
  &.greese-Avatar--lg, .greese-Group & { gap: 1px; }
}
.greese-Group-item {
  > .greese-Avatar { content: '{'; }
  #{'.x'} .greese-Avatar { gap: 2px; }
}`)
  })

  it('leaves out top-level rules about components outside the family', () => {
    const copied = copySource(
      `.greese-Accordion { gap: 0; }
.greese-AccordionItem { padding: 0; }
.greese-Accordion > .greese-AccordionItem + .greese-AccordionItem { border: 0; }
@include mixins.up(md) { .greese-Accordion { gap: 1px; } }`,
      'greese-AccordionItem',
      ['greese-AccordionItem', 'greese-Collapsible']
    )
    expect(copied).toBe(`& { padding: 0; }

@include mixins.up(md) { .greese-Accordion { gap: 1px; } }`)
  })

  it('compiles for every component the library styles, inside its own component()', () => {
    const failures: string[] = []
    for (const name of readdirSync(COMPONENTS)) {
      if (NOT_COPYABLE.has(name) || !blocks[name]) continue
      const source = readFileSync(join(COMPONENTS, name, `${name}.scss`), 'utf8')
      const spec = {
        tokens: {},
        components: { [name]: { scss: copySource(source, blocks[name]!.className) } },
      }
      const errors = validateSpec(spec)
      const result = errors.length ? { errors } : compileSpec(spec)
      if ('errors' in result)
        failures.push(`${name}: ${result.errors[0]!.split('\n')[0]}`)
    }
    expect(failures).toEqual([])
  }, 60_000)
})
