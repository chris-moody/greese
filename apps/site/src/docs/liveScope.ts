/**
 * The packages a docs page's code can name, in one place. "Show code" and Try
 * it's starting code name components from these exports (toJsx.ts), and the
 * live editor resolves those names from the same exports (LiveCode.tsx).
 *
 * Two lists drifted twice: a package in one and not the other gives a page
 * whose Try it throws `ReferenceError: Highlighted is not defined` in dev and,
 * in a production build, names the component by its minified function name
 * (`<u>`, an HTML element, so nothing even throws). A package whose components
 * have docs pages goes here; `liveScope.test.ts` renders every page's starting
 * code and fails on a name the editor can't resolve.
 */
import * as React from 'react'
import * as Authoring from '@greese/authoring'
import * as Icons from '@greese/icons'
import * as Greese from '@greese/react'
import * as Svg from '@greese/react/svg'
import { createElement, useState, type ReactNode } from 'react'
import { art, countries } from '../../../docs/stories/_shared/fixtures.tsx'
import { Replay } from '../../../docs/stories/_shared/Replay.tsx'

/**
 * Every export, by name. Later packages win a shared name: `Timeline` is
 * authoring's component, not greese.js's class that `@greese/react` re-exports,
 * since only a component appears in JSX.
 */
export const LIBRARY: Readonly<Record<string, unknown>> = {
  ...Greese,
  ...Svg,
  ...Icons,
  ...Authoring,
}

/**
 * An authoring story's own environment prints as `<AuthoringProvider>` (its
 * Provider's name). In the editor it is a fresh, empty environment; a page whose
 * example needs a prepared one passes its own through `parameters.tryIt.scope`.
 */
const AuthoringProvider = ({ children }: { children?: ReactNode }) => {
  const [env] = useState(() => Authoring.createAuthoringEnvironment())
  return createElement(env.Provider, null, children)
}

/**
 * What the live editor's code can name: the library, React and its hooks, an
 * authoring environment, the docs' sample data and `Replay`. react-live turns each key into a function
 * parameter, so only plain identifiers: a namespace's `default` would be a
 * syntax error.
 */
export const LIVE_SCOPE: Readonly<Record<string, unknown>> = Object.fromEntries(
  Object.entries({
    ...React,
    React,
    ...LIBRARY,
    AuthoringProvider,
    art,
    countries,
    Replay,
  }).filter(([name]) => name !== 'default' && /^[A-Za-z_$][\w$]*$/.test(name))
)

/** The editor's code as react-live compiles it: several top-level elements render as a fragment. */
export const transformCode = (code: string): string => `<>\n${code}\n</>`
