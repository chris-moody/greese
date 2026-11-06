/** The homepage's sections, in order: their ids and names. */
export const SECTIONS = [
  ['why', 'Why'],
  ['size', 'Size'],
  ['speed', 'Speed'],
  ['motion', 'Motion'],
  ['components', 'Components'],
] as const

/**
 * Where a section counts as the one being read: a little below the sticky
 * header, whose height is also where in-page links land (Header sets the
 * page's scroll padding to it).
 */
export const SPY_OFFSET = 100

/** The studio's tabs, which the phone menu links to. */
export const STUDIO_TABS = [
  ['tokens', 'Tokens'],
  ['components', 'Components'],
  ['shapes', 'Shapes'],
  ['motion', 'Motion'],
  ['output', 'Output'],
] as const
