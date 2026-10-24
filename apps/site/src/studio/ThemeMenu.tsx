import { useId, type CSSProperties, type JSX } from 'react'
import {
  Button,
  Popover,
  Radio,
  RadioGroup,
  Segment,
  SegmentedControl,
  Stack,
  Text,
  useColorScheme,
} from '@greese/react'
import { ShapesIcon, SpeedIcon } from '@greese/icons'
import { color } from '@greese/ui'
import { shapePoints } from '@greese/ui/shapes'
import { getIn } from './edit.ts'
import { resolveColor } from './fields.tsx'
import { applyMotion, MOTIONS, motionIn, type MotionPreset } from './motions.ts'
import { applyPreset, PRESETS, randomPreset, type Preset } from './presets.ts'
import type { RenderedColors } from './protocol.ts'
import { applyShape, SHAPES, shapeIn, type ShapePreset } from './shapes.ts'
import type { SchemeValue, ThemeSpec } from './spec.ts'
import { applyVariant, VARIANTS, variantIn } from './variants.ts'

const BRAND = ['primary', 'secondary', 'tertiary', 'accent'] as const

type Scheme = 'light' | 'dark'

/** A theme value's color in one scheme, as a hex. */
const dot = (value: SchemeValue | undefined, fallback: string, scheme: Scheme) =>
  resolveColor(typeof value === 'object' ? value[scheme] : (value ?? fallback), scheme) ??
  fallback

/** The color theme the theme's colors are, if any. */
const colorIn = (spec: ThemeSpec): Preset | undefined =>
  PRESETS.find(
    (p) =>
      JSON.stringify(getIn(spec, ['tokens', 'color']) ?? {}) === JSON.stringify(p.color)
  )

/**
 * The four brand colors as a diamond (primary at the top, then clockwise) on
 * the theme's canvas, in the scheme being shown: the page they'll sit on.
 */
const Diamond = ({ colors: [canvas, ...brand] }: { colors: string[] }) => (
  <span className="studio-theme-canvas" style={{ background: canvas }} aria-hidden="true">
    <span className="studio-theme-diamond">
      {brand.map((background, i) => (
        <span key={i} style={{ background }} />
      ))}
    </span>
  </span>
)

const ROLES = ['canvas', ...BRAND] as const

const presetColors = (preset: Preset, scheme: Scheme) =>
  ROLES.map((role) => dot(preset.color[role], color[role][scheme], scheme))

/**
 * The brand colors of the theme being edited: as the preview renders them
 * once it has reported (so `var()`, `oklch()` and alpha are right), else
 * read from the theme.
 */
const currentColors = (spec: ThemeSpec, scheme: Scheme, rendered?: RenderedColors) =>
  ROLES.map(
    (role) =>
      rendered?.[scheme][role]?.slice(0, 7) ??
      dot(
        getIn(spec, ['tokens', 'color', role]) as SchemeValue | undefined,
        color[role][scheme],
        scheme
      )
  )

/**
 * A shape theme's control, drawn small: the same points its CSS is built
 * from, or, for a theme of radii and depth, its own sample.
 */
const ShapeSample = ({ preset }: { preset: ShapePreset }) => {
  const def = preset.shapes[`${preset.id}-control`]
  const points = def ? shapePoints(def, 30, 16) : []
  return (
    <span
      className="studio-theme-shape"
      aria-hidden="true"
      style={
        points.length
          ? {
              clipPath: `polygon(${points.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})`,
            }
          : (preset.sample as CSSProperties)
      }
    />
  )
}

/** A motion theme as its first two letters: `Wi`, `Po`. */
const MotionMark = ({ preset }: { preset: MotionPreset }) => (
  <span className="studio-theme-mark" aria-hidden="true">
    {preset.label.slice(0, 2)}
  </span>
)

const NONE = 'none'
const CUSTOM = 'custom'

/**
 * The theme picker in the header: a theme is three layers (ADR 0025), one of
 * each at a time. Colors (brand colors and tinted neutrals), shapes (radii
 * and shaped components) and motion (timing, pacing and how content
 * arrives). Choosing one layer leaves the other two alone. The button shows
 * the colors as a diamond, the shape theme's sample and the motion theme's
 * first two letters, or a plain shape and motion icon when there is none.
 */
export const ThemeMenu = ({
  spec,
  onChange,
  rendered,
}: {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  rendered?: RenderedColors
}): JSX.Element => {
  const { resolvedScheme: scheme } = useColorScheme()
  // Per instance: the header renders this twice (bar and drawer), and radios
  // sharing a name across the page would be one group.
  const id = useId()
  const colors = colorIn(spec)
  const shape = shapeIn(spec)
  const motion = motionIn(spec)
  const variant = variantIn(spec)
  const summary = `Theme: ${colors?.label ?? 'custom'} colors${variant ? `, ${variant.label.toLowerCase()}` : ''}, ${shape ? `${shape.label} shapes` : 'no shape theme'}, ${motion ? `${motion.label} motion` : 'no motion theme'}`

  return (
    <Popover
      placement="bottom-end"
      label="Theme"
      className="studio-theme-picker"
      trigger={
        <Button
          size="sm"
          variant="soft"
          tone="neutral"
          aria-label={summary}
          title={summary}
        >
          <span className="studio-theme-trigger">
            <Diamond colors={currentColors(spec, scheme, rendered)} />
            {/* One box to hide on the narrowest phones (site.scss). */}
            <span className="studio-theme-layers">
              {shape ? <ShapeSample preset={shape} /> : <ShapesIcon />}
              {motion ? <MotionMark preset={motion} /> : <SpeedIcon />}
            </span>
          </span>
        </Button>
      }
    >
      {/* The scroller is inside: a shaped popover's border mustn't scroll with its content. */}
      <Stack gap={4} className="studio-theme-scroll">
        <Text variant="caption" tone="muted">
          A theme is one of each: colors, shapes and motion.
        </Text>

        <Stack gap={2}>
          <RadioGroup
            label="Colors"
            name={`${id}-colors`}
            value={colors?.id ?? CUSTOM}
            onValueChange={(id) => {
              const preset = PRESETS.find((p) => p.id === id)
              if (preset) onChange(applyPreset(spec, preset))
            }}
            className="studio-theme-group"
          >
            {PRESETS.map((preset) => (
              <Radio
                key={preset.id}
                value={preset.id}
                label={
                  <span className="studio-theme-option">
                    <Diamond colors={presetColors(preset, scheme)} />
                    {preset.label}
                  </span>
                }
              />
            ))}
            {!colors && <Radio value={CUSTOM} label="Custom" disabled />}
          </RadioGroup>
          <Stack direction="row" gap={2} align="center" justify="between" wrap="wrap">
            {/* How the colors are worn: part of the color layer, so any colors take it. */}
            <SegmentedControl
              label="Color style"
              hideLabel
              size="sm"
              value={variant?.id ?? NONE}
              onValueChange={(id) =>
                onChange(
                  applyVariant(
                    spec,
                    VARIANTS.find((v) => v.id === id)
                  )
                )
              }
            >
              <Segment value={NONE}>Filled</Segment>
              {VARIANTS.map((v) => (
                <Segment key={v.id} value={v.id}>
                  {v.label}
                </Segment>
              ))}
            </SegmentedControl>
            <Button
              size="sm"
              variant="ghost"
              tone="neutral"
              onClick={() => onChange(applyPreset(spec, randomPreset()))}
            >
              Random colors
            </Button>
          </Stack>
        </Stack>

        <RadioGroup
          label="Shapes"
          name={`${id}-shapes`}
          value={shape?.id ?? NONE}
          onValueChange={(id) =>
            onChange(
              applyShape(
                spec,
                SHAPES.find((p) => p.id === id)
              )
            )
          }
          className="studio-theme-group"
        >
          <Radio
            value={NONE}
            label={
              <span className="studio-theme-option">
                <ShapesIcon />
                Library defaults
              </span>
            }
          />
          {SHAPES.map((preset) => (
            <Radio
              key={preset.id}
              value={preset.id}
              label={
                <span className="studio-theme-option">
                  <ShapeSample preset={preset} />
                  {preset.label}
                </span>
              }
            />
          ))}
        </RadioGroup>

        <RadioGroup
          label="Motion"
          name={`${id}-motion`}
          value={motion?.id ?? NONE}
          onValueChange={(id) =>
            onChange(
              applyMotion(
                spec,
                MOTIONS.find((p) => p.id === id)
              )
            )
          }
          className="studio-theme-group"
        >
          <Radio
            value={NONE}
            label={
              <span className="studio-theme-option">
                <SpeedIcon />
                Library defaults
              </span>
            }
          />
          {MOTIONS.map((preset) => (
            <Radio
              key={preset.id}
              value={preset.id}
              label={
                <span className="studio-theme-option">
                  <MotionMark preset={preset} />
                  {preset.label}
                </span>
              }
              description={preset.description.split(':')[1]!.split('.')[0]!.trim()}
            />
          ))}
        </RadioGroup>
      </Stack>
    </Popover>
  )
}
