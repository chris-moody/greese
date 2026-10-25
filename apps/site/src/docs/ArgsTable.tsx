/**
 * A component's props, and with a story, a control for each one it can set:
 * Storybook's Controls block, built from GreeseUI's own components. The props
 * come from the library's TSDoc (server/docgen.ts); a story's `argTypes` add
 * or narrow controls as they do in Storybook.
 */
import type { JSX } from 'react'
import {
  Button,
  Code,
  Input,
  NumberField,
  Segment,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@greese/react'
import type { ComponentDoc, PropDoc } from '../../server/docgen.ts'
import { useStoryArgs, type StoryArgs } from './args.ts'
import type { ArgType, ComposedStory } from './load.ts'
import { Markdown } from './Markdown.tsx'

type ControlKind = 'options' | 'radio' | 'boolean' | 'number' | 'text'

const controlName = (control: ArgType['control']): string | undefined =>
  typeof control === 'string' ? control : control ? control.type : undefined

/** Which control a prop gets, from its argType first, then its type. */
export const controlKind = (
  prop: Pick<PropDoc, 'type' | 'options'> | undefined,
  argType: ArgType | undefined,
  value: unknown
): ControlKind | undefined => {
  if (argType?.control === false || argType?.table?.disable) return undefined
  const named = controlName(argType?.control)
  const options = argType?.options ?? prop?.options
  if (options?.length)
    return named === 'inline-radio' || named === 'radio' || options.length <= 4
      ? 'radio'
      : 'options'
  if (named === 'boolean' || prop?.type === 'boolean') return 'boolean'
  if (named === 'number' || named === 'range' || prop?.type === 'number') return 'number'
  if (named === 'text' || prop?.type === 'string' || typeof value === 'string')
    return 'text'
  return undefined
}

/**
 * A prop's documented default as the value its control shows while the story
 * leaves it unset: `"solid"` → `solid`, `false` → false, `16` → 16.
 */
export const defaultValue = (kind: ControlKind, text: string | undefined): unknown => {
  if (text === undefined) return undefined
  const unquoted = text.replace(/^(['"])(.*)\1$/, '$2')
  if (kind === 'boolean') return text === 'true'
  if (kind === 'number') return Number.isFinite(Number(text)) ? Number(text) : undefined
  return unquoted
}

const Control = ({
  name,
  kind,
  options,
  state,
  fallback,
}: {
  name: string
  kind: ControlKind
  options: readonly unknown[]
  state: StoryArgs
  /** The prop's default, shown while the story leaves it unset. */
  fallback?: string
}): JSX.Element => {
  const value = state.args[name] ?? defaultValue(kind, fallback)
  const set = (next: unknown) => state.set(name, next)
  switch (kind) {
    case 'radio':
      return (
        <SegmentedControl
          size="sm"
          label={name}
          value={value === undefined ? '' : String(value)}
          onValueChange={set}
        >
          {options.map((option) => (
            <Segment key={String(option)} value={String(option)}>
              {String(option)}
            </Segment>
          ))}
        </SegmentedControl>
      )
    case 'options':
      return (
        <Select
          size="sm"
          aria-label={name}
          value={value === undefined ? '' : String(value)}
          placeholder="Choose…"
          onChange={(event) => set(event.target.value || undefined)}
        >
          {options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </Select>
      )
    case 'boolean':
      return (
        <Switch
          aria-label={name}
          checked={value === true}
          onCheckedChange={(checked) => set(checked)}
        />
      )
    case 'number':
      return (
        <NumberField
          size="sm"
          label={name}
          hideLabel
          value={typeof value === 'number' ? value : null}
          onValueChange={(next) => set(next ?? undefined)}
        />
      )
    case 'text':
      return (
        <Input
          size="sm"
          aria-label={name}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => set(event.target.value)}
        />
      )
  }
}

interface Row {
  name: string
  prop?: PropDoc
  argType?: ArgType
}

export interface ArgsTableProps {
  /** The component's docs; without them, only the story's argTypes have rows. */
  docs?: ComponentDoc
  /** The story the controls drive; without one, the table only describes. */
  story?: ComposedStory
  /** Names the table: "Button props". */
  caption: string
}

const Described = ({ row }: { row: Row }): JSX.Element => (
  <Stack gap={1}>
    {(row.prop?.description || row.argType?.description) && (
      <div className="docs-prose docs-prop-description">
        <Markdown>{row.prop?.description || row.argType?.description || ''}</Markdown>
      </div>
    )}
    {row.prop && (
      <Text variant="p3" tone="muted">
        <Code>{row.prop.type}</Code>
      </Text>
    )}
  </Stack>
)

const Rows = ({ rows, state }: { rows: Row[]; state?: StoryArgs }): JSX.Element => (
  <>
    {rows.map((row) => {
      const kind = state && controlKind(row.prop, row.argType, state.args[row.name])
      return (
        <TableRow key={row.name}>
          <TableHeaderCell scope="row">
            <Code>{row.name}</Code>
            {row.prop?.required && (
              <span className="docs-required" aria-label="required">
                *
              </span>
            )}
          </TableHeaderCell>
          <TableCell label="Description">
            <Described row={row} />
          </TableCell>
          <TableCell label="Default">
            {row.prop?.default ? <Code>{row.prop.default}</Code> : '–'}
          </TableCell>
          {state && (
            <TableCell label="Control">
              {kind ? (
                <Control
                  name={row.name}
                  kind={kind}
                  options={row.argType?.options ?? row.prop?.options ?? []}
                  state={state}
                  fallback={row.prop?.default}
                />
              ) : (
                '–'
              )}
            </TableCell>
          )}
        </TableRow>
      )
    })}
  </>
)

const rowsOf = (
  docs: ComponentDoc | undefined,
  story: ComposedStory | undefined
): Row[] => {
  const argTypes = story?.argTypes ?? {}
  const rows: Row[] = (docs?.props ?? [])
    .filter((prop) => !argTypes[prop.name]?.table?.disable)
    .map((prop) => ({ name: prop.name, prop, argType: argTypes[prop.name] }))
  // Args a story adds of its own (not props), when they have a control.
  for (const [name, argType] of Object.entries(argTypes))
    if (
      !rows.some((row) => row.name === name) &&
      argType.control &&
      !argType.table?.disable
    )
      rows.push({ name, argType })
  return rows
}

const Controlled = ({
  rows,
  story,
  caption,
}: {
  rows: Row[]
  story: ComposedStory
  caption: string
}): JSX.Element => {
  const state = useStoryArgs(story)
  return (
    <Stack gap={2}>
      <Table caption={caption} hideCaption stackBelow="md" density="compact">
        <Head controls />
        <TableBody>
          <Rows rows={rows} state={state} />
        </TableBody>
      </Table>
      {state.edited && (
        <div>
          <Button size="sm" variant="soft" tone="neutral" onClick={state.reset}>
            Reset controls
          </Button>
        </div>
      )}
    </Stack>
  )
}

const Head = ({ controls }: { controls?: boolean }): JSX.Element => (
  <TableHead>
    <TableRow>
      <TableHeaderCell>Name</TableHeaderCell>
      <TableHeaderCell>Description</TableHeaderCell>
      <TableHeaderCell>Default</TableHeaderCell>
      {controls && <TableHeaderCell>Control</TableHeaderCell>}
    </TableRow>
  </TableHead>
)

export const ArgsTable = ({
  docs,
  story,
  caption,
}: ArgsTableProps): JSX.Element | null => {
  const rows = rowsOf(docs, story)
  if (!rows.length) return null
  if (story) return <Controlled rows={rows} story={story} caption={caption} />
  return (
    <Table caption={caption} hideCaption stackBelow="md" density="compact">
      <Head />
      <TableBody>
        <Rows rows={rows} />
      </TableBody>
    </Table>
  )
}
