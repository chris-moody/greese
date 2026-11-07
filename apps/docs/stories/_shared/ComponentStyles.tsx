/**
 * The Styling section of every component's docs page, and the blocks behind
 * Guides/Component reference. Everything comes from the library's style
 * manifests (@greese/ui's style manifest and @greese/react's component styles), so it can't drift:
 * the blocks a component renders itself, its items' blocks, the blocks of the
 * components it's built on, and override examples written for it.
 */
import type { JSX, ReactNode } from 'react'
import { Source, Subheading } from '@storybook/addon-docs/blocks'
import manifest from '@greese/ui/style-manifest.json' with { type: 'json' }
import componentStyles from '@greese/react/component-styles.json' with { type: 'json' }
import { Anatomy } from './Anatomy.tsx'
import { familyOf, ownBlocks } from './family.ts'

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
  classes: Record<string, { parent?: string; properties: string[] }>
  states: Record<string, { on: string[]; properties: string[] }>
  variableInfo: Record<
    string,
    { default?: string; setBy: string[]; affects: string[]; type: string }
  >
}

interface ComponentUse {
  blocks: string[]
  renders: string[]
  builtOn: string[]
}

const blocks = manifest.blocks as unknown as Record<string, BlockStyles>
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
  CopyToClipboard: (
    <>
      renders no element of its own: its child gets the click and{' '}
      <code>data-copy-status</code> (<code>copied</code>, <code>failed</code>), and a
      visually hidden live region sits beside it. Style the child, by that attribute for
      the moment after a copy.
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

/** What a set of CSS properties styles, in words: the first group a property matches. */
const GROUPS: [RegExp, string][] = [
  [/^(transition|animation|view-transition)/, 'motion'],
  [/^(overflow|scroll|overscroll|scrollbar)/, 'scrolling'],
  [/^(cursor|pointer-events|user-select|touch-action|resize|appearance)/, 'interaction'],
  [
    /^(opacity|filter|backdrop-filter|mix-blend|mask|clip-path|transform|translate|scale|rotate|perspective|visibility)/,
    'effects',
  ],
  [/^(border|outline|box-shadow)/, 'border'],
  [/^(color|background|fill|stroke|accent-color|caret-color|color-scheme)/, 'color'],
  [/^(padding|margin)/, 'spacing'],
  [/size$|width$|height$|^aspect-ratio/, 'size'],
  [
    /^(font|line-height|letter-spacing|text|white-space|word|hyphens|-webkit-line-clamp|line-clamp|content|list-style|vertical-align)/,
    'text',
  ],
  [
    /^(display|position|inset|top|right|bottom|left|float|z-index|order|flex|grid|gap|row-gap|column-gap|place-|align-|justify-|box-sizing|container|contain)/,
    'layout',
  ],
]

/** The order they're said in: where it is and how big, then how it looks, then how it acts. */
const SAID = [
  'layout',
  'size',
  'spacing',
  'text',
  'color',
  'border',
  'effects',
  'motion',
  'scrolling',
  'interaction',
]

/** Every block's variables, to follow a modifier's variables to what they set. */
const allVariables = Object.assign(
  {},
  ...Object.values(blocks).map((b) => b.variableInfo)
) as BlockStyles['variableInfo']

/** "Layout, color and border": what `properties` style, variables followed through. */
const styles = (properties: string[]): string => {
  const real = properties.flatMap((p) =>
    p.startsWith('--') ? (allVariables[p]?.affects ?? []) : [p]
  )
  const found = new Set(real.map((p) => GROUPS.find(([pattern]) => pattern.test(p))?.[1]))
  const groups = SAID.filter((group) => found.has(group))
  if (!groups.length) return ''
  const words =
    groups.length > 1
      ? `${groups.slice(0, -1).join(', ')} and ${groups.at(-1)}`
      : groups[0]!
  return words[0]!.toUpperCase() + words.slice(1)
}

const muted = (text: string) => <span style={{ opacity: 0.7 }}>{text}</span>

/** One table of a block's styling API, in the docs' scrolling table box. */
const Table = ({
  label,
  columns,
  children,
}: {
  label: string
  columns: string[]
  children: ReactNode
}) => (
  <div className="docs-table-scroll" role="region" aria-label={label} tabIndex={0}>
    <table style={{ inlineSize: '100%' }}>
      <caption style={{ textAlign: 'start', fontWeight: 600 }}>{label}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col" style={{ textAlign: 'start' }}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
)

interface PartRow {
  name: string
  type: string
  parent?: string
  styles: ReactNode
}

/**
 * Every element and state a block styles: its root, its parts, the
 * modifiers props set on them, and the attributes it styles, each with what
 * it sits in or applies to and what its rules set.
 */
const partRows = (block: BlockStyles): PartRow[] => {
  const root = block.className
  const own = (cls: string) => block.classes[cls] ?? { properties: [] }
  const said = (cls: string, fallback: string) =>
    styles(own(cls).properties) || muted(fallback)
  return [
    { name: `.${root}`, type: 'Root class', styles: said(root, 'Nothing of its own') },
    ...block.parts.map((part) => ({
      name: `.${root}-${part}`,
      type: 'Part class',
      parent: own(`${root}-${part}`).parent ?? root,
      styles: said(`${root}-${part}`, 'Only what is inside it'),
    })),
    ...[
      ...block.modifiers.map((m) => `${root}--${m}`),
      ...Object.entries(block.partModifiers).flatMap(([part, mods]) =>
        mods.map((m) => `${root}-${part}--${m}`)
      ),
    ].map((cls) => ({
      name: `.${cls}`,
      type: 'Modifier class',
      parent: own(cls).parent ?? cls.split('--')[0],
      styles: said(cls, 'Only what is inside it'),
    })),
    ...block.attributes.map((attribute) => {
      const state = block.states[attribute]
      return {
        name: attribute,
        type: 'State attribute',
        parent: state?.on.join(', '),
        styles: (state && styles(state.properties)) || muted('Only what is inside it'),
      }
    }),
  ]
}

/**
 * The variables that are this block's own: a shared system's (motion roles,
 * type variants, overlays, easings) and another component's (IconButton
 * reads Button's) are documented where they're defined.
 */
const ownVariables = (block: BlockStyles): string[] => {
  const shared = /^--greese-(motion|type|overlay|ease|scrollbar)-/
  const others = Object.keys(blocks)
    .filter((b) => b !== block.name)
    .map((b) => `--greese-${b.toLowerCase()}-`)
  return block.variables.filter(
    (v) =>
      (block.name === 'Motion' || !shared.test(v)) &&
      (v.startsWith(`--greese-${block.name.toLowerCase()}-`) ||
        !others.some((prefix) => v.startsWith(prefix)))
  )
}

/** What sets a variable that has no default: the block's own modifiers and states. */
const setBy = (block: BlockStyles, variable: string): string[] =>
  (block.variableInfo[variable]?.setBy ?? []).filter(
    (by) => by.startsWith('[') || by.startsWith(`${block.className}-`)
  )

/**
 * What sets a variable with no default, in short: "Set by the ghost, solid
 * modifiers, and [aria-pressed=true]".
 */
const SetBy = ({ block, by }: { block: BlockStyles; by: string[] }) => {
  const modifiers = by
    .filter((b) => !b.startsWith('['))
    .map((b) => b.slice(block.className.length).replace(/^-+/, ''))
  const states = by.filter((b) => b.startsWith('['))
  return (
    <>
      {muted('Set by ')}
      {modifiers.length > 0 && (
        <>
          {muted('the ')}
          <Codes items={modifiers} />
          {muted(modifiers.length > 1 ? ' modifiers' : ' modifier')}
        </>
      )}
      {modifiers.length > 0 && states.length > 0 && muted(', and ')}
      {states.length > 0 && <Codes items={states} />}
    </>
  )
}

/**
 * One block's full styling API as tables: its parts (root, parts, modifiers
 * and states), its responsive props, and its own variables. In
 * `docs-table-scroll` boxes, as the app's docs style their tables.
 */
export const BlockTable = ({
  block,
  caption = true,
}: {
  block: BlockStyles
  /** Whether to name the block above its tables; a list that names it already doesn't. */
  caption?: boolean
}): JSX.Element => {
  const variables = ownVariables(block)
  const responsive = Object.entries(block.responsive)
  return (
    <div style={{ display: 'grid', gap: 'var(--greese-space-3)' }}>
      {caption && (
        <p style={{ margin: 0, fontWeight: 600 }}>
          {block.name}{' '}
          <small style={{ fontWeight: 400 }}>· css/{block.stylesheet}.css</small>
        </p>
      )}
      <Table label={`${block.name} parts`} columns={['Name', 'Type', 'Parent', 'Styles']}>
        {partRows(block).map((row) => (
          <tr key={row.name}>
            <th scope="row" style={{ textAlign: 'start', fontWeight: 400 }}>
              <code>{row.name}</code>
            </th>
            <td style={{ whiteSpace: 'nowrap' }}>{row.type}</td>
            {/* A class a line, unbroken: they're long, and break badly at hyphens. */}
            <td style={{ whiteSpace: 'nowrap' }}>
              {row.parent
                ? row.parent.split(', ').map((p, i) => (
                    <span key={p}>
                      {i > 0 && <br />}
                      <code>.{p}</code>
                    </span>
                  ))
                : muted('—')}
            </td>
            <td>{row.styles}</td>
          </tr>
        ))}
      </Table>
      {responsive.length > 0 && (
        <Table label={`${block.name} responsive props`} columns={['Prop', 'Values']}>
          {responsive.map(([prop, tokens]) => (
            <tr key={prop}>
              <th scope="row" style={{ textAlign: 'start', fontWeight: 400 }}>
                <code>{prop}</code>
              </th>
              <td>
                {tokens.length ? (
                  <Codes items={tokens} />
                ) : (
                  muted('Any value, as a variable')
                )}
                <br />
                <small style={{ opacity: 0.7 }}>
                  Set the prop; don’t target its classes.
                </small>
              </td>
            </tr>
          ))}
        </Table>
      )}
      {variables.length > 0 && (
        <Table
          label={`${block.name} variables`}
          columns={['Name', 'Default', 'Type', 'Affects']}
        >
          {variables.map((v) => {
            const info = block.variableInfo[v]
            const by = setBy(block, v)
            return (
              <tr key={v}>
                <th scope="row" style={{ textAlign: 'start', fontWeight: 400 }}>
                  <code>{v}</code>
                </th>
                <td>
                  {info?.default !== undefined ? (
                    <code>{info.default}</code>
                  ) : by.length ? (
                    <SetBy block={block} by={by} />
                  ) : (
                    muted('None: set it to use it')
                  )}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{info?.type ?? 'value'}</td>
                <td>
                  {info?.affects.length ? (
                    <Codes items={info.affects} />
                  ) : (
                    muted('Read by the component’s script')
                  )}
                </td>
              </tr>
            )
          })}
        </Table>
      )}
    </div>
  )
}

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
  anatomy,
}: {
  name: string
  subcomponents?: string[]
  /** An example to take apart, labelled with its classes: the page's first story. */
  anatomy?: ReactNode
}): JSX.Element | null => {
  const use = components[name]
  if (!use) return null
  const own = ownBlocks(name).map((b) => blocks[b]!)
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

      {anatomy && (own.length > 0 || builtOn.length > 0) && (
        <>
          <Subheading>Anatomy</Subheading>
          <p>
            Every element of {name}, and of what it contains and is built on, outlined and
            labelled with the classes it carries.
          </p>
          <Anatomy name={name} family={familyOf(name, subcomponents)}>
            {anatomy}
          </Anatomy>
        </>
      )}

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
