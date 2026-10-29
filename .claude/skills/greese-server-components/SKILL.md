---
name: greese-server-components
description: React Server Components (RSC) and SSR for greese ui - where the 'use client' boundary goes, what a Server Component can and can't do, serializable props, the children/slot pattern, import leakage, provider isolation, and keeping server-safe components behaving like their client versions. Use when adding or removing 'use client', making a component server-safe, splitting a server path from a client part, reviewing a change for RSC/SSR breakage, or writing docs and templates that show greese ui in a Server Components app.
---

# React Server Components in greese ui

Load `greese-conventions` first. This skill expands its `'use client'` rule and
ADR 0027 (`docs/adr/0027-client-boundaries.md`), which records what forces
the directive, measured against React 19's server build. Read ADR 0027 before
moving a boundary. ADR 0009 covers the `greese` prop's server/client split,
and ADR 0013 promises that "SSR and React Server Components work".

## What a Server Component is for, and what it isn't

| For                                                                                | Not for                                                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Fetching data directly (database, filesystem, internal API) with no endpoint       | Events: `onClick`, `onChange`, any listener                                                            |
| Keeping heavy code (markdown, syntax highlighting, date formatting) off the client | `useState`, `useReducer`, `useEffect`, `useLayoutEffect`, `useRef`, `createContext`                    |
| Keeping secrets and proprietary logic out of the browser                           | `window`, `document`, `localStorage` and other browser APIs                                            |
| Static markup: layouts, articles, product copy, headers, footers                   | Browser subscriptions: resize, geolocation, service workers, media queries (`useMediaQuery` is client) |

React's server build _does_ provide `useId`, `useMemo`, `useCallback`, `use`,
`cloneElement` and `Children` (ADR 0027), so those don't force the directive.

## Core rules

1. **Server by default, in an app.** In an RSC framework, a module with no
   directive is a Server Component when the server imports it.
2. **In this library, no directive means shared, not server-only.** Our
   unmarked modules (Button, Table, Stack, Accordion…) must also work when a
   client module imports them, and in a plain SPA or SSR app with no RSC (the
   web app in `apps/site` is one: Vite, with `server/prerender.ts` rendering
   `/` to HTML at build time). So a library component is **never** `async`,
   never imports `server-only`, never reads secrets, and never fetches data.
   Those patterns belong in consumer apps, docs and templates.
3. **`'use client'` marks a boundary, at the very top of the file.** Every
   export of the file becomes a client reference, and everything it imports
   joins the client bundle.
4. **Imports go one way.** A Server Component can import a client one. A
   client module can't import a _server-only_ one (async, `server-only`,
   secrets). A shared module that it imports just runs on the client.
5. **Server content goes into client components as `children` or a slot
   prop.** React renders it on the server first and passes the result in.
6. **Props that cross into a client component must serialize,** and so must
   host-element props from a Server Component. That rules out functions
   (except Server Actions), class instances, DOM nodes and symbols. React
   rejects them with "Functions cannot be passed directly to Client
   Components" or "Event handlers cannot be passed to Client Component props".

## Where the boundary goes: the leaves pattern

Push `'use client'` out to the interactive leaves. Each pattern below has a
greese example to copy:

| Pattern                                                            | In greese ui                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Static UI stays shared**                                         | `Table` (all seven parts) dropped its context so it could (ADR 0027 §1). `Accordion` passes group settings by `cloneElement`, not context, and renders native `<details name>` exclusivity through `Collapsible`.                                                                                                                                                                                      |
| **Split a server path from a client leaf**                         | [`Pagination.tsx`](../../../packages/react/src/components/Pagination/Pagination.tsx): with `getHref` and a controlled `page` it calls `renderPagination` on the server, where it _can_ call the function. Otherwise it renders the `'use client'` leaf [`PaginationState.tsx`](../../../packages/react/src/components/Pagination/PaginationState.tsx). Split only when the server path has a real use. |
| **Pure parts leave client files** (import leakage)                 | `Avatar/AvatarGroup.tsx` and `Breadcrumbs/BreadcrumbItem.tsx` moved out of their `'use client'` siblings, because the directive covered every export in the file.                                                                                                                                                                                                                                      |
| **Attach a handler only when one is given**                        | `Button` and `IconButton` add `onClick` only around one that was passed. `Collapsible` adds `onToggle` only with `onOpenChange`. `Alert` renders its dismiss `IconButton` only with `onDismiss`. From the server, no function reaches the DOM.                                                                                                                                                         |
| **Server children inside a client wrapper**                        | [`withGreese`](../../../packages/react/src/utils/greese.ts) resolves CSS presets on the server (`resolveGreese` is pure). Only when the prop needs JavaScript does it wrap the server-rendered element as `children` of the client `GreeseIsland`, which attaches through `Slot` with no extra element.                                                                                                |
| **Heavy code loads lazily from the leaf**                          | `GreeseIsland` loads the greese.js runtime and scopes with dynamic imports (`Motion/registry.ts`), so a CSS-only `greese` prop ships none of it.                                                                                                                                                                                                                                                       |
| **Isolate providers**                                              | `ThemeProvider` is a small client file with `display: contents` and `asChild`. Wrap the subtree that needs a scoped theme, not the whole root, and its server children stay server-rendered.                                                                                                                                                                                                           |
| **Keep a boundary when removing it costs behaviour**               | `Field` keeps its context (ADR 0027 §2): cloning would make ten controls server-safe but silently lose label and error wiring inside your own wrappers. `ActionSelect` requires `onAction`, so it stays client.                                                                                                                                                                                        |
| **Move work to build time** (the SPA's version of "on the server") | `apps/site/server/docsIndex.ts` reads the docs from disk into a virtual module, and `server/prerender.ts` renders the home page's HTML at build time so its first screen paints before any JavaScript runs.                                                                                                                                                                                            |

## Server-safe must not mean less safe

Removing a client guard has to keep everything the props promise. A
component dropping a `preventDefault()` click handler for HTML and CSS is
exposed to these gaps (Button, which made exactly that switch in `9586d9e`,
is the case to check against):

- **A loading `type="submit"` that becomes `type="button"` stops being the
  form's default button.** Under HTML's implicit-submission rules, Enter in a
  field then triggers the _next_ submit button, or, in a form with one text
  field and no other submit button, submits the form with no button at all.
  A click handler that called `preventDefault()` blocked both, because
  implicit submission fires a click on the default button. A test that only
  clicks the button won't catch this.
- **`pointer-events: none` stops only pointers.** A loading link stays
  focusable by design (only `disabled` adds `tabIndex={-1}`), and a link
  takes no `onClick`, so Enter still follows it. Assistive technology can
  activate it too, while `aria-disabled="true"` tells it otherwise.
- **`asChild` handlers run child first.** `Slot` merges handlers child
  first, so a router `Link`'s own `onClick` navigates before the component's
  `preventDefault()` runs.
- **`tabIndex={-1}` doesn't stop a screen reader** listing a link or following
  its `href`. Browse modes and links lists ignore tab order and pointer
  hit-testing. A disabled link should lose its `href` instead
  (`<a role="link" aria-disabled="true">`), which needs no script.

Before making a component server-safe, list how each state (disabled,
loading, read-only) is blocked for **pointer, keyboard (Enter and Space),
implicit form submission and assistive technology**. Then show that the
no-script version blocks all four, or keep the client guard. If the behaviour
changes, amend ADR 0027.

## Rules for library code

- `'use client'` only for state, effects, refs, context, browser APIs, or a
  function the component creates and hands to an element. Not for `useId`,
  `useMemo` or `useCallback`.
- **One boundary per concern:** put a client part in its own file
  (`PaginationState.tsx`), and don't put a pure export in a client file.
- **No branching on environment** (`typeof window`) during render. The same
  props must give the same markup on server and client, or hydration
  mismatches. Read browser state in effects or `useSyncExternalStore` with a
  server snapshot (`hooks/useMediaQuery.ts`).
- **No `Date.now()`, randomness or locale-dependent formatting during render**
  without a fixed input. Use `useId` for ids.
- **Function props on a shared component** are allowed only when the
  component calls them during render (`getHref`, `labels.page`) or attaches
  them only when given. Document which props need a client caller in the
  prop's TSDoc, as `GreeseOptions.timeline` and `scope` do.
- **The barrel** (`src/index.ts`) has no directive. `tsc` keeps each file's
  own directive in `dist`, so check `head -1 dist/components/<X>/<X>.js`
  after a build when you move one.

## Rules for app code: docs, templates, the MCP server's examples

When an example shows greese ui in an RSC framework (Next.js App Router and
similar):

- **Fetch where you render.** Run independent requests in parallel
  (`Promise.all`) instead of fetching at the root and passing props down, to
  avoid waterfalls.
- **Mark server-only modules** with `import 'server-only'` so a client import
  fails at build time. This is an _app_ dependency: never add it to a greese
  package (that needs an ADR, per the house rules).
- **Trim data that crosses the boundary:** pass a client component only the
  fields it renders, not the database row.
- **Stream slow parts:** wrap a slow Server Component in `<Suspense>` with a
  light fallback, such as `Skeleton`, so the layout paints first.
- **Keep headers, footers and article pages on the server.** greese layout,
  text and `Table` render there with no JavaScript.
- **Watch for caching surprises:** frameworks cache server output
  (`cache`, `revalidate`, `no-store`), so stale data is usually a cache
  layer, not a component bug.
- **Use Server Actions for form posts:** `<Button type="submit" formAction={action}>`
  works from a Server Component, because a Server Action serializes.

## Testing

| Check                                                               | Proves                                                                                         | Doesn't prove                                                                                              |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `components/directives.test.ts`                                     | a file without the directive doesn't call React's client hooks or pass an inline arrow handler | calls to our own client hooks (`useControllableState(`), or a named function handed to an element          |
| `functionProps(node, serverComponents)` (`src/test/serverProps.ts`) | no function reaches a host element or an unlisted (client) component                           | that the tree renders under React's `react-server` build                                                   |
| Behaviour tests (`forms.test.tsx` style)                            | the no-script version blocks presses                                                           | anything not exercised: add Enter in a field, Enter and Space on the element, and a two-submit-button form |

Every server-safe component needs a `functionProps` test for its server
render (Table, Pagination, AvatarGroup, BreadcrumbItem and Button have one).
Put the test next to the component's other tests. Follow `greese-testing`
for layers and run `greese-verify` before calling it done.

## Checklist for a boundary change

1. Read ADR 0027. Is the component useful without its callbacks? If not,
   keep it client.
2. List what forces the directive (rule 6, and the hooks table above).
   Remove each cause, or split it into a leaf file.
3. Check behaviour parity (the four input paths above).
4. Add or extend the `functionProps` test, and run `directives.test.ts`.
5. Update the TSDoc to say which props need a client caller.
6. Build `packages/react` and check each changed file's directive in `dist`.
7. Run `npm run size`: a boundary move changes what ships.
8. Amend ADR 0027 if the decision changes, and add a changeset.
