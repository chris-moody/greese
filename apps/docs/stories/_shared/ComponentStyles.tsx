/**
 * The Styling section of every component's docs page, and the blocks behind
 * Guides/Component reference. Everything comes from the library's style
 * manifests (@greese/ui's style manifest and @greese/react's component styles), so it can't drift:
 * the blocks a component renders itself, its items' blocks, the blocks of the
 * components it's built on, and override examples written for it.
 */
import type { JSX } from 'react'
import { Source, Subheading } from '@storybook/addon-docs/blocks'
import manifest from '@greese/ui/style-manifest.json' with { type: 'json' }
import componentStyles from '@greese/react/component-styles.json' with { type: 'json' }

interface BlockStyles {
  name: string
  className: string
  stylesheet: string
  parts: string[]
  modifiers: string[]
  partModifiers: Record<string, string[]>
  responsive: Record<string, string[]>
  attributes: string[]
  variables: string[]
}

interface ComponentUse {
  blocks: string[]
  renders: string[]
  builtOn: string[]
}

const blocks = manifest.blocks as Record<string, BlockStyles>
const components = componentStyles.components as Record<string, ComponentUse>

/**
 * Components that render no class of their own: what to target instead,
 * following the component's name.
 * Anything exported with no blocks and no entry here gets a generic note.
 */
const UNSTYLED: Record<string, JSX.Element> = {
  TableHead: (
    <>
      renders a native <code>&lt;thead&gt;</code> with no class of its own; the
      table&apos;s stylesheet styles it. Target it through the table:{' '}
      <code>.greese-Table thead</code>, or give it a <code>className</code>.
    </>
  ),
  TableBody: (
    <>
      renders a native <code>&lt;tbody&gt;</code> with no class of its own; the
      table&apos;s stylesheet styles it (striped and hoverable rows). Target it through
      the table: <code>.greese-Table tbody</code>, or give it a <code>className</code>.
    </>
  ),
  TableFoot: (
    <>
      renders a native <code>&lt;tfoot&gt;</code> with no class of its own. Target it
      through the table: <code>.greese-Table tfoot</code>, or give it a{' '}
      <code>className</code>.
    </>
  ),
  Slot: (
    <>
      renders no element of its own: it merges its props, <code>className</code> and{' '}
      <code>style</code> included, onto its child. Style the child.
    </>
  ),
  Slottable: (
    <>
      renders no element of its own: it marks which child of a <code>Slot</code> receives
      the merged props. Style that child.
    </>
  ),
}

const none = <span style={{ opacity: 0.6 }}>None</span>

const Codes = ({ items }: { items: string[] }) =>
  items.length ? (
    <>
      {items.map((item, i) => (
        <span key={item}>
          {i > 0 && ', '}
          <code>{item}</code>
        </span>
      ))}
    </>
  ) : (
    none
  )

const ROWS: Array<[label: string, help: string, items: (b: BlockStyles) => string[]]> = [
  ['Root', 'On the outermost element', (b) => [`.${b.className}`]],
  ['Parts', 'Elements inside it', (b) => b.parts.map((p) => `.${b.className}-${p}`)],
  [
    'Modifiers',
    'Set by props, on the root or a part',
    (b) => [
      ...b.modifiers.map((m) => `.${b.className}--${m}`),
      ...Object.entries(b.partModifiers).flatMap(([p, mods]) =>
        mods.map((m) => `.${b.className}-${p}--${m}`)
      ),
    ],
  ],
  ['States', 'Attributes it styles', (b) => b.attributes],
  [
    'Responsive props',
    'Set the prop; don’t target these classes',
    (b) =>
      Object.entries(b.responsive).map(([prop, tokens]) =>
        tokens.length ? `${prop}: ${tokens.join(' | ')}` : prop
      ),
  ],
  ['Variables', 'Set on it or any ancestor', (b) => b.variables],
]

/**
 * One block's full styling API: every row, "None" where it has nothing. In a
 * `docs-table-scroll` box, as the app's docs style their tables.
 */
export const BlockTable = ({
  block,
  caption = true,
}: {
  block: BlockStyles
  /** Whether to name the block above its rows; a list that names it already doesn't. */
  caption?: boolean
}): JSX.Element => (
  <div
    className="docs-table-scroll"
    role="region"
    aria-label={`${block.name} classes`}
    tabIndex={0}
  >
    <table style={{ inlineSize: '100%' }}>
      {caption && (
        <caption style={{ textAlign: 'start', fontWeight: 600 }}>
          {block.name} <small>· css/{block.stylesheet}.css</small>
        </caption>
      )}
      <thead>
        <tr>
          <th scope="col" style={{ textAlign: 'start' }}>
            Kind
          </th>
          <th scope="col" style={{ textAlign: 'start' }}>
            Classes and names
          </th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map(([label, help, items]) => (
          <tr key={label}>
            <th
              scope="row"
              style={{ whiteSpace: 'nowrap', textAlign: 'start', inlineSize: '14rem' }}
            >
              {label}
              <br />
              <small style={{ fontWeight: 400, opacity: 0.7 }}>{help}</small>
            </th>
            <td>
              <Codes items={items(block)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

/** A variable that reads as a setting (tone, height, width…), not internal state. */
const knob = (b: BlockStyles) =>
  b.variables.find((v) => !/-(bg|fg|border|hover|active|index|offset|dir)$/.test(v)) ??
  b.variables[0]

/** CSS and kit overrides, written for this component's real classes. */
const examples = (name: string, own: BlockStyles[], builtOn: BlockStyles[]) => {
  const target = own.find((b) => b.name === name) ?? own[0] ?? builtOn[0]
  if (!target) return undefined
  const c = target.className
  const css: string[] = [`.${c} {\n  /* every ${name} */\n}`]
  const kit: string[] = [`@use 'pkg:@greese/ui/scss/kit' as greese;`, '']
  const variable = knob(target)
  const base = own.length ? builtOn.find((b) => b.parts.length) : undefined

  if (variable)
    css.push(`.sidebar .${c} {\n  ${variable}: …; /* a setting, anywhere below */\n}`)
  if (target.modifiers[0]) css.push(`.${c}--${target.modifiers[0]} {\n  …\n}`)
  if (target.parts[0]) css.push(`.${c}-${target.parts[0]} {\n  …\n}`)
  if (target.attributes[0]) css.push(`.${c}${target.attributes[0]} {\n  …\n}`)
  if (base)
    css.push(
      `/* From ${base.name}, which it's built on */\n.${c} .${base.className}-${base.parts[0]} {\n  …\n}`
    )

  kit.push(`@include greese.component(${target.name}) {`, `  // every ${name}`)
  if (variable)
    kit.push(`  @include greese.vars((${variable.replace('--greese-', '')}: …));`)
  if (target.modifiers[0])
    kit.push(`  @include greese.modifier(${target.modifiers[0]}) { … }`)
  if (target.parts[0]) kit.push(`  @include greese.part(${target.parts[0]}) { … }`)
  if (target.attributes[0]) kit.push(`  &${target.attributes[0]} { … }`)
  if (base) kit.push(`  #{greese.class(${base.name}, ${base.parts[0]})} { … }`)
  kit.push(`  @include greese.motion((enter: fade-up));`, '}')
  return { css: css.join('\n\n'), kit: kit.join('\n') }
}

/** Whether the manifest knows this exported component. */
export const hasStyles = (name: string): boolean => name in components

/**
 * A component's Styling section.
 *
 * @param name           the component: `AccordionItem`
 * @param subcomponents  its items, which also have pages of their own
 */
export const ComponentStyles = ({
  name,
  subcomponents = [],
}: {
  name: string
  subcomponents?: string[]
}): JSX.Element | null => {
  const use = components[name]
  if (!use) return null
  const own = use.blocks.map((b) => blocks[b]!)
  const builtOn = use.builtOn.map((b) => blocks[b]!)
  // Its items' own blocks, then what they're built on: Accordion's items are
  // Collapsibles.
  const items = subcomponents
    .flatMap((s) => components[s]?.blocks ?? [])
    .concat(subcomponents.flatMap((s) => components[s]?.builtOn ?? []))
    .filter(
      (b, i, all) =>
        !use.blocks.includes(b) && !use.builtOn.includes(b) && all.indexOf(b) === i
    )
    .map((b) => blocks[b]!)
  const example = examples(name, own, builtOn)

  return (
    <>
      <p>
        {own.length ? (
          <>
            <code>{name}</code> renders{' '}
            <Codes items={own.map((b) => `.${b.className}`)} />
            {builtOn.length > 0 && (
              <>
                , and is built on <Codes items={builtOn.map((b) => b.name)} />, whose
                classes are on it or inside it too
              </>
            )}
            . Class names are prefixed and never hashed.
          </>
        ) : builtOn.length ? (
          <>
            <code>{name}</code> has no classes of its own: it&apos;s built on{' '}
            <Codes items={builtOn.map((b) => b.name)} />, so it&apos;s styled through
            theirs, below.
          </>
        ) : (
          <>
            <code>{name}</code>{' '}
            {UNSTYLED[name] ?? (
              <>
                renders no classes of its own. Give it a <code>className</code> to style
                it.
              </>
            )}
          </>
        )}
      </p>

      {own.length > 0 && (
        <>
          <Subheading>Classes</Subheading>
          {own.map((block) => (
            <BlockTable key={block.name} block={block} />
          ))}
        </>
      )}

      {items.length > 0 && (
        <>
          <Subheading>Items</Subheading>
          <p>
            The components that go inside it, and what they&apos;re built on. Each has its
            own page with the same details.
          </p>
          {items.map((block) => (
            <BlockTable key={block.name} block={block} />
          ))}
        </>
      )}

      {builtOn.length > 0 && (
        <>
          <Subheading>Built on</Subheading>
          <p>
            These classes come from the components {name} renders. Their variables and
            token overrides apply to it as well.
          </p>
          {builtOn.map((block) => (
            <BlockTable key={block.name} block={block} />
          ))}
        </>
      )}

      {example && (
        <>
          <Subheading>Overriding</Subheading>
          <p>
            Your own CSS is unlayered, so it beats the library without{' '}
            <code>!important</code>. Prefer a variable where there is one: it covers the
            states derived from it.
          </p>
          <Source code={example.css} language="css" dark />
          <p>
            Or with the SCSS kit, which adds the prefix, checks every name at build time,
            and still lets style props and the <code>greese</code> prop override it:
          </p>
          {/* 'scss' is registered in .storybook/preview.tsx; Source's type lists only built-ins. */}
          <Source code={example.kit} language={'scss' as 'css'} dark />
          <p>
            Parts and modifiers can change in a minor release; through the kit, a renamed
            one stops your build instead of silently not matching. See{' '}
            <strong>Guides/Styling components</strong>.
          </p>
        </>
      )}
    </>
  )
}

/** Every block, by name: the Component reference page's list. */
export const ALL_BLOCKS: readonly BlockStyles[] = Object.values(blocks).sort((a, b) =>
  a.name.localeCompare(b.name)
)

export type { BlockStyles }
