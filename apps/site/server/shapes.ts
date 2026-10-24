import { compileSpec } from './studio.ts'
import { motionOnlySpec, type MotionPreset } from '../src/studio/motions.ts'
import { shapeOnlySpec, type ShapePreset } from '../src/studio/shapes.ts'
import { variantOnlySpec, type ColorVariant } from '../src/studio/variants.ts'

const KINDS = {
  shape:
    'A GreeseUI shape theme (ADR 0025): radii, and components outlined with one\n * clip and one border ring each (ADR 0024), in @layer greese.overrides. It\n * sets no colors and no motion, so it goes with any color or motion theme.',
  motion:
    'A GreeseUI motion theme (ADR 0025): it assigns the motion roles (which\n * built-in effect plays where, and which duration and easing it takes) and\n * paces every entrance. It redefines no effect and no token, and sets no\n * colors and no shapes, so it goes with any of those.',
  variant:
    "A GreeseUI color variant (ADR 0025): how any color theme's colors are worn,\n * reassigned per component variant in @layer greese.overrides. It sets no\n * color tokens, shapes or motion, so it goes with any color, shape or motion\n * theme.",
}

const SOURCES = { shape: 'shapes', motion: 'motions', variant: 'variants' }

/** What a theme's files start with: what it is, and how to use it. */
const header = (
  id: string,
  description: string,
  kind: keyof typeof KINDS,
  file: 'scss' | 'css'
) =>
  `/**\n * ${description}\n *\n * ${KINDS[kind]}\n * ${
    file === 'css'
      ? `Load it after GreeseUI's styles:\n *\n *   import '@greese/ui/themes/${id}.css'`
      : `Compile it with Sass's package importer, after GreeseUI's\n * styles, or use the compiled ${id}.css.`
  }\n *\n * Generated from apps/site/src/studio/${SOURCES[kind]}.ts (npm run themes -w site).\n */\n`

/** A shape or motion theme's, or a color variant's, kit SCSS and compiled CSS: that alone. */
export const themeFile = (
  preset: ShapePreset | MotionPreset | ColorVariant,
  kind: keyof typeof KINDS = 'shape'
): { scss: string; css: string } => {
  const spec =
    kind === 'shape'
      ? shapeOnlySpec(preset as ShapePreset)
      : kind === 'motion'
        ? motionOnlySpec(preset as MotionPreset)
        : variantOnlySpec(preset as ColorVariant)
  const compiled = compileSpec(spec)
  if ('errors' in compiled) throw new Error(`${preset.id}: ${compiled.errors.join('\n')}`)
  return {
    scss: header(preset.id, preset.description, kind, 'scss') + compiled.scss,
    css: header(preset.id, preset.description, kind, 'css') + compiled.css,
  }
}
