/**
 * The `<script>` build: dist/greese.global.js, one minified file that sets
 * `window.greese`, for pages without a bundler (served by unpkg/jsDelivr).
 */
import { build } from 'esbuild'

await build({
  entryPoints: ['dist/index.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'greese',
  target: 'es2022',
  legalComments: 'none',
  outfile: 'dist/greese.global.js',
})
