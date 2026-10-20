/**
 * `import '@greese/react/greese'`: puts the `greese` prop's runtime (and
 * greese.js) in the main bundle, so JavaScript-driven motion attaches before
 * the first paint. Without it, the runtime loads on first use. Import it
 * once, at your app's entry.
 */
import * as runtime from './components/Motion/greeseRuntime.ts'
import {
  registerGreeseRuntime,
  registerGreeseScopes,
} from './components/Motion/registry.ts'
import * as scopes from './components/Motion/scope.ts'

registerGreeseRuntime(runtime)
registerGreeseScopes(scopes)
