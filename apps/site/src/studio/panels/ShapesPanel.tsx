import { useEffect, useRef, useState, type JSX, type PointerEvent } from 'react'
import {
  Button,
  Checkbox,
  Field,
  Heading,
  IconButton,
  Input,
  Menu,
  MenuItem,
  Segment,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextField,
  toast,
} from '@greese/react'
import { CopyIcon, TrashIcon } from '@greese/icons'
import {
  SHAPE_PRESETS,
  SHAPE_TARGETS,
  opensToBox,
  shapeClass,
  shapeParams,
  shapePoints,
  type ShapeDef,
  type ShapeLength,
  type ShapeParams,
  type ShapePoint,
} from '@greese/ui/shapes'
import { setIn } from '../edit.ts'
import type { ThemeSpec } from '../spec.ts'

type State = 'params' | 'hover' | 'active'
const STATES: Array<[State, string]> = [
  ['params', 'Rest'],
  ['hover', 'Hover'],
  ['active', 'Pressed'],
]

/** Boxes to draw the shape in: the same points have to work at every size. */
const BOXES = {
  button: { w: 168, h: 44, label: 'Button' },
  card: { w: 280, h: 180, label: 'Card' },
  square: { w: 120, h: 120, label: 'Square' },
} as const
type BoxName = keyof typeof BOXES

const COLORS: Array<[string, string]> = [
  ['auto', 'The component’s own'],
  ['var(--greese-color-border)', 'border'],
  ['var(--greese-color-border-strong)', 'border-strong'],
  ['var(--greese-color-primary)', 'primary'],
  ['var(--greese-color-accent)', 'accent'],
  ['var(--greese-color-fg)', 'fg'],
]

const NAME = /^[a-z][a-z0-9-]*$/
const PARAM = /^[a-z][a-z0-9]*$/

/** A coordinate at a box size, as the compiler computes it (without rounding arcs). */
const coord = (l: ShapeLength, size: number, params: ShapeParams) =>
  ((l.pct ?? 0) / 100) * size + (l.px ?? 0) + (l.param ? (l.k ?? 1) * (params[l.param] ?? 0) : 0)

/** A state's parameters: the rest values with the state's on top. */
const paramsIn = (def: ShapeDef, state: State): ShapeParams => ({
  ...def.params,
  ...(state === 'params' ? {} : def[state]),
})

const round = (n: number, step = 0.5) => Math.round(n / step) * step

/** Parameters moving toward a target over a normal duration, as the page moves them. */
const useTween = (target: ShapeParams): ShapeParams => {
  const [shown, setShown] = useState(target)
  const from = useRef(target)
  const key = JSON.stringify(target)
  useEffect(() => {
    const start = from.current
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = target
      return setShown(target)
    }
    const began = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - began) / 200)
      const e = 1 - (1 - t) ** 3
      const next: ShapeParams = {}
      for (const k of new Set([...Object.keys(start), ...Object.keys(target)]))
        next[k] = (start[k] ?? 0) + ((target[k] ?? 0) - (start[k] ?? 0)) * e
      from.current = next
      setShown(next)
      if (t < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
    // The key stands for the target's values.
  }, [key])
  return shown
}

const PAD = 28

/**
 * The shape drawn at one size: its fill, its border ring (the same points the
 * CSS is built from), and a handle per point. Dragging a handle moves its
 * pixels, or its parameter when it has one; with Shift, its percentage.
 */
const Canvas = ({
  def,
  box,
  state,
  selected,
  onSelect,
  onChange,
}: {
  def: ShapeDef
  box: BoxName
  state: State
  selected: number
  onSelect: (i: number) => void
  onChange: (def: ShapeDef) => void
}): JSX.Element => {
  const { w, h } = BOXES[box]
  const params = useTween(paramsIn(def, state))
  const border = def.border?.width ?? 1
  const outline = shapePoints(def, w, h, params)
  const inner = shapePoints(def, w, h, params, border)
  const path = (pts: Array<[number, number]>) =>
    `M${pts.map(([x, y]) => `${x + PAD},${y + PAD}`).join('L')}Z`
  const handles = def.points.map((p) => [coord(p.x, w, params) + PAD, coord(p.y, h, params) + PAD] as const)
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ i: number; x: number; y: number; def: ShapeDef } | null>(null)

  const scale = () => {
    const r = svg.current!.getBoundingClientRect()
    return (w + PAD * 2) / r.width
  }
  const move = (event: PointerEvent) => {
    const d = drag.current
    if (!d) return
    const s = scale()
    const dx = (event.clientX - d.x) * s
    const dy = (event.clientY - d.y) * s
    const next = structuredClone(d.def)
    const p = next.points[d.i]!
    const shift = (l: ShapeLength, delta: number, size: number): ShapeLength => {
      if (event.shiftKey) return { ...l, pct: round((l.pct ?? 0) + (delta / size) * 100, 0.5) }
      if (l.param) {
        // Move the parameter in the state being edited: every point using it follows.
        const k = l.k ?? 1
        const set = state === 'params' ? (next.params ??= {}) : (next[state] ??= {})
        const was = paramsIn(d.def, state)[l.param] ?? 0
        set[l.param] = Math.max(0, round(was + delta / k))
        return l
      }
      return { ...l, px: round((l.px ?? 0) + delta) }
    }
    if (Math.abs(dx) > 0.01) p.x = shift(p.x, dx, w)
    if (Math.abs(dy) > 0.01) p.y = shift(p.y, dy, h)
    onChange(next)
  }

  const insert = (i: number) => {
    const a = def.points[i]!
    const b = def.points[(i + 1) % def.points.length]!
    const mid = (l1: ShapeLength, l2: ShapeLength): ShapeLength => ({
      pct: round(((l1.pct ?? 0) + (l2.pct ?? 0)) / 2, 0.5),
      px: round(((l1.px ?? 0) + (l2.px ?? 0)) / 2),
      ...(l1.param && l1.param === l2.param && (l1.k ?? 1) === (l2.k ?? 1) && { param: l1.param, k: l1.k }),
    })
    const points = [...def.points]
    points.splice(i + 1, 0, { x: mid(a.x, b.x), y: mid(a.y, b.y) })
    onChange({ ...def, points })
    onSelect(i + 1)
  }

  return (
    // Not an icon: the shape editor's canvas, drawn from the shape's own points.
    // eslint-disable-next-line no-restricted-syntax
    <svg
      ref={svg}
      className="studio-shape-canvas"
      viewBox={`0 0 ${w + PAD * 2} ${h + PAD * 2}`}
      role="img"
      aria-label={`The shape in a ${w} by ${h} box`}
      onPointerMove={move}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
    >
      <rect className="studio-shape-box" x={PAD} y={PAD} width={w} height={h} />
      <path className="studio-shape-fill" d={path(outline)} />
      <path className="studio-shape-ring" d={`${path(outline)}${path(inner)}`} fillRule="evenodd" />
      {handles.map(([x, y], i) => {
        const [nx, ny] = handles[(i + 1) % handles.length]!
        return (
          <g key={i}>
            <circle
              className="studio-shape-add"
              cx={(x + nx) / 2}
              cy={(y + ny) / 2}
              r={4}
              onClick={() => insert(i)}
            >
              <title>Add a point here</title>
            </circle>
            <circle
              className="studio-shape-handle"
              data-selected={i === selected || undefined}
              cx={x}
              cy={y}
              r={6}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                drag.current = { i, x: event.clientX, y: event.clientY, def }
                onSelect(i)
              }}
            >
              <title>{`Point ${i + 1}: drag; Shift-drag for percentages`}</title>
            </circle>
          </g>
        )
      })}
    </svg>
  )
}

const Num = ({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  step?: number
}): JSX.Element => (
  <Input
    aria-label={label}
    size="sm"
    type="number"
    step={step}
    value={value ?? ''}
    onChange={(e) => {
      const v = e.currentTarget.value
      onChange(v === '' || !Number.isFinite(Number(v)) ? undefined : Number(v))
    }}
  />
)

/** One coordinate: percent of the box, plus px, plus a parameter times k. */
const LengthRow = ({
  axis,
  value,
  params,
  onChange,
}: {
  axis: 'x' | 'y'
  value: ShapeLength
  params: string[]
  onChange: (value: ShapeLength) => void
}): JSX.Element => (
  <div className="studio-shape-length">
    <Text variant="p3" weight="semibold">
      {axis}
    </Text>
    <Num label={`${axis} percent`} value={value.pct} step={0.5} onChange={(pct) => onChange({ ...value, pct })} />
    <Text variant="caption" tone="muted">
      % +
    </Text>
    <Num label={`${axis} pixels`} value={value.px} step={0.5} onChange={(px) => onChange({ ...value, px })} />
    <Text variant="caption" tone="muted">
      px +
    </Text>
    <Num
      label={`${axis} times`}
      value={value.param ? (value.k ?? 1) : undefined}
      step={0.5}
      onChange={(k) => onChange({ ...value, k })}
    />
    <Select
      aria-label={`${axis} parameter`}
      size="sm"
      value={value.param ?? ''}
      onChange={(e) => {
        const param = e.currentTarget.value
        const { param: _p, k: _k, ...rest } = value
        onChange(param ? { ...rest, param, k: value.k ?? 1 } : rest)
      }}
    >
      <option value="">no parameter</option>
      {params.map((p) => (
        <option key={p} value={p}>
          × {p}
        </option>
      ))}
    </Select>
  </div>
)

/**
 * The theme's shapes (ADR 0024): pick one, or start one from a preset; edit
 * its points on a canvas, its parameters per state, its border and focus;
 * and choose which components take it. Every shape is also a
 * `greese-shape-<name>` class for any element.
 */
export const ShapesPanel = ({
  spec,
  onChange,
}: {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
}): JSX.Element => {
  const names = Object.keys(spec.shapes ?? {}).sort()
  const [chosen, setChosen] = useState<string>()
  const name = chosen && spec.shapes?.[chosen] ? chosen : names[0]
  const def = name ? spec.shapes![name]! : undefined
  const [box, setBox] = useState<BoxName>('button')
  const [state, setState] = useState<State>('params')
  const [point, setPoint] = useState(0)
  const [rename, setRename] = useState('')
  const [newParam, setNewParam] = useState('')

  const put = (next: ShapeDef) => onChange(setIn(spec, ['shapes', name!], next))
  const create = (preset: string) => {
    let id = preset
    for (let n = 2; spec.shapes?.[id]; n++) id = `${preset}-${n}`
    onChange(setIn(spec, ['shapes', id], SHAPE_PRESETS[preset]!()))
    setChosen(id)
    setPoint(0)
  }
  const assigned = (component: string) => spec.components?.[component]?.shape === name

  const header = (
    <Stack direction="row" gap={2} align="end" wrap="wrap">
      {names.length > 0 && (
        <Field label="Shape">
          <Select size="sm" value={name} onChange={(e) => (setChosen(e.currentTarget.value), setPoint(0))}>
            {names.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </Select>
        </Field>
      )}
      <Menu trigger={<Button size="sm" variant="soft" tone="neutral">New shape</Button>}>
        {Object.keys(SHAPE_PRESETS).map((preset) => (
          <MenuItem key={preset} onSelect={() => create(preset)}>
            {preset}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  )

  if (!name || !def)
    return (
      <Stack gap={3}>
        <Text variant="p3" tone="muted">
          Shapes outline buttons and containers with one clip and a border that follows it, and
          animate by their parameters. Start one from a preset.
        </Text>
        {header}
      </Stack>
    )

  const params = shapeParams(def)
  const selected = def.points[Math.min(point, def.points.length - 1)]!
  const setPointAt = (i: number, p: ShapePoint) => {
    const points = [...def.points]
    points[i] = p
    put({ ...def, points })
  }
  const setParam = (s: State, key: string, value: number | undefined) => {
    const set = { ...(def[s] ?? {}) }
    if (value === undefined) delete set[key]
    else set[key] = value
    put({ ...def, [s]: Object.keys(set).length ? set : undefined })
  }
  const focus = def.focus ?? 'auto'

  return (
    <Stack gap={5}>
      {header}

      <Stack gap={2}>
        <Stack direction="row" justify="between" align="center" gap={2} wrap="wrap">
          <SegmentedControl label="Preview box" hideLabel size="xs" value={box} onValueChange={(v) => setBox(v as BoxName)}>
            {Object.entries(BOXES).map(([k, b]) => (
              <Segment key={k} value={k}>
                {b.label}
              </Segment>
            ))}
          </SegmentedControl>
          <SegmentedControl label="State" hideLabel size="xs" value={state} onValueChange={(v) => setState(v as State)}>
            {STATES.map(([k, label]) => (
              <Segment key={k} value={k}>
                {label}
              </Segment>
            ))}
          </SegmentedControl>
        </Stack>
        <Canvas def={def} box={box} state={state} selected={point} onSelect={setPoint} onChange={put} />
        <Text variant="caption" tone="muted">
          Drag a point to move its pixels, or its parameter if it has one (in the state shown);
          Shift-drag for its percentage. Click a small dot to add a point.
        </Text>
      </Stack>

      <Stack gap={2}>
        <Stack direction="row" justify="between" align="center">
          <Heading level={3} variant="h6">
            Point {Math.min(point, def.points.length - 1) + 1} of {def.points.length}
          </Heading>
          <IconButton
            size="sm"
            label="Delete this point"
            disabled={def.points.length <= 3}
            onClick={() => {
              put({ ...def, points: def.points.filter((_, i) => i !== point) })
              setPoint(Math.max(0, point - 1))
            }}
          >
            <TrashIcon />
          </IconButton>
        </Stack>
        <LengthRow axis="x" value={selected.x} params={params} onChange={(x) => setPointAt(point, { ...selected, x })} />
        <LengthRow axis="y" value={selected.y} params={params} onChange={(y) => setPointAt(point, { ...selected, y })} />
        <div className="studio-shape-length">
          <Text variant="p3" weight="semibold">
            round
          </Text>
          <Num
            label="Corner radius in pixels"
            value={typeof selected.round === 'number' ? selected.round : undefined}
            onChange={(r) => {
              const { round: _r, ...rest } = selected
              setPointAt(point, r ? { ...rest, round: r } : rest)
            }}
          />
          <Text variant="caption" tone="muted">
            px, or
          </Text>
          <Select
            aria-label="Corner radius parameter"
            size="sm"
            value={typeof selected.round === 'string' ? selected.round : ''}
            onChange={(e) => {
              const { round: _r, ...rest } = selected
              setPointAt(point, e.currentTarget.value ? { ...rest, round: e.currentTarget.value } : rest)
            }}
          >
            <option value="">no parameter</option>
            {params.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </div>
      </Stack>

      <Stack gap={2}>
        <Heading level={3} variant="h6">
          Parameters
        </Heading>
        <Text variant="caption" tone="muted">
          Pixels per state. States animate between these values, so the shape and its border
          move together. Empty means the rest value.
        </Text>
        <div className="studio-shape-params" role="table" aria-label="Parameters by state">
          <div role="row" className="studio-shape-params-row">
            <Text variant="caption" weight="semibold" role="columnheader">
              name
            </Text>
            {STATES.map(([k, label]) => (
              <Text key={k} variant="caption" weight="semibold" role="columnheader">
                {label}
              </Text>
            ))}
          </div>
          {params.map((p) => (
            <div role="row" className="studio-shape-params-row" key={p}>
              <code className="studio-mono" role="rowheader">
                {p}
              </code>
              {STATES.map(([s, label]) => (
                <span role="cell" key={s}>
                  <Num label={`${p}, ${label}`} value={def[s]?.[p]} onChange={(v) => setParam(s, p, v)} />
                </span>
              ))}
            </div>
          ))}
        </div>
        <Stack direction="row" gap={2} align="end">
          <TextField
            label="New parameter"
            size="sm"
            value={newParam}
            invalid={!!newParam && !PARAM.test(newParam)}
            onChange={(e) => setNewParam(e.currentTarget.value)}
          />
          <Button
            size="sm"
            variant="soft"
            tone="neutral"
            disabled={!PARAM.test(newParam) || params.includes(newParam)}
            onClick={() => {
              setParam('params', newParam, 0)
              setNewParam('')
            }}
          >
            Add
          </Button>
        </Stack>
      </Stack>

      <Stack gap={3}>
        <Heading level={3} variant="h6">
          Border and focus
        </Heading>
        <div className="studio-row">
          <Text variant="p3" className="studio-row-label">
            border width (px)
          </Text>
          <Num
            label="Border width"
            value={def.border?.width}
            onChange={(width) => put({ ...def, border: { ...def.border, width } })}
          />
        </div>
        <div className="studio-row">
          <Text variant="p3" className="studio-row-label">
            border color
          </Text>
          <Select
            aria-label="Border color"
            size="sm"
            value={def.border?.color ?? 'auto'}
            onChange={(e) => put({ ...def, border: { ...def.border, color: e.currentTarget.value } })}
          >
            {COLORS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="studio-row">
          <Text variant="p3" className="studio-row-label">
            focus
          </Text>
          <SegmentedControl
            label="Focus"
            hideLabel
            size="xs"
            value={focus}
            onValueChange={(v) => put({ ...def, focus: v === 'auto' ? undefined : (v as 'box' | 'ring') })}
          >
            <Segment value="auto">Auto</Segment>
            <Segment value="box" disabled={!opensToBox(def)}>
              Open to box
            </Segment>
            <Segment value="ring">Ring</Segment>
          </SegmentedControl>
        </div>
        <Switch
          label="Mirror for right-to-left text"
          checked={!!def.mirror}
          onCheckedChange={(on) => put({ ...def, mirror: on || undefined })}
        />
      </Stack>

      <Stack gap={2}>
        <Heading level={3} variant="h6">
          Used by
        </Heading>
        <Stack gap={1}>
          {Object.keys(SHAPE_TARGETS).map((component) => (
            <Checkbox
              key={component}
              label={component}
              checked={assigned(component)}
              onCheckedChange={(on) =>
                onChange(setIn(spec, ['components', component, 'shape'], on ? name : undefined))
              }
            />
          ))}
        </Stack>
        <Stack direction="row" gap={2} align="center">
          <Text variant="p3">
            Anywhere: <code className="studio-mono">{shapeClass(name)}</code>
          </Text>
          <IconButton
            size="sm"
            label="Copy the class name"
            onClick={() =>
              void navigator.clipboard
                .writeText(shapeClass(name))
                .then(() => toast({ title: 'Copied', description: shapeClass(name) }))
            }
          >
            <CopyIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Stack direction="row" gap={2} align="end" wrap="wrap">
        <TextField
          label="Rename"
          size="sm"
          value={rename}
          placeholder={name}
          invalid={!!rename && (!NAME.test(rename) || !!spec.shapes?.[rename])}
          onChange={(e) => setRename(e.currentTarget.value)}
        />
        <Button
          size="sm"
          variant="soft"
          tone="neutral"
          disabled={!NAME.test(rename) || !!spec.shapes?.[rename]}
          onClick={() => {
            let next = setIn(setIn(spec, ['shapes', rename], def), ['shapes', name], undefined)
            for (const [c, comp] of Object.entries(spec.components ?? {}))
              if (comp.shape === name) next = setIn(next, ['components', c, 'shape'], rename)
            onChange(next)
            setChosen(rename)
            setRename('')
          }}
        >
          Rename
        </Button>
        <Button
          size="sm"
          variant="ghost"
          tone="negative"
          onClick={() => {
            let next = setIn(spec, ['shapes', name], undefined)
            for (const [c, comp] of Object.entries(spec.components ?? {}))
              if (comp.shape === name) next = setIn(next, ['components', c, 'shape'], undefined)
            onChange(next)
            setChosen(undefined)
          }}
        >
          Delete shape
        </Button>
      </Stack>
    </Stack>
  )
}
