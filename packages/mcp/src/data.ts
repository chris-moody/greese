import { readFileSync } from 'node:fs'

/** One prop of a component, as its TSDoc describes it. */
export interface PropDoc {
  name: string
  type: string
  required: boolean
  default?: string
  description: string
}

/** A component's entry in the style manifest (ADR 0010): what a theme can target. */
export interface StyleEntry {
  className: string
  parts: string[]
  modifiers: string[]
  attributes: string[]
  variables: string[]
}

export interface ComponentDoc {
  name: string
  /** Its docs category: Layout, Forms, Content, Overlays, Navigation, Motion, Utilities. */
  category: string
  description: string
  /** Where it lives, relative to the repository. */
  file: string
  props: PropDoc[]
  styles?: StyleEntry
  /** Its stories file: working usage, args first. */
  example?: string
}

export interface Guide {
  name: string
  title: string
  text: string
}

export interface ThemeDoc {
  id: string
  description: string
  /** The kit source: compile it after GreeseUI's styles, or read it as a recipe. */
  scss: string
  /** The same, compiled. */
  css: string
}

export interface Template {
  id: string
  description: string
  source: string
}

/** Everything the server answers from: dist/data.json, written at build time. */
export interface GreeseData {
  version: string
  components: ComponentDoc[]
  tokens: Record<string, unknown>
  icons: string[]
  guides: Guide[]
  themes: ThemeDoc[]
  templates: Template[]
  /** The SCSS the templates share (their `tpl-*` classes). */
  templateStyles?: string
}

/** The data this build shipped with. */
export const loadData = (): GreeseData =>
  JSON.parse(readFileSync(new URL('./data.json', import.meta.url), 'utf8')) as GreeseData
