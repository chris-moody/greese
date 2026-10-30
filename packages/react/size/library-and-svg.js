// size-limit's entry for the whole library with @greese/react/svg
// (.size-limit.cjs): both entry points whole, as an app that uses
// everything bundles them. Not published.
import * as library from '../dist/index.js'
import * as svg from '../dist/svg/index.js'

export { library, svg }
