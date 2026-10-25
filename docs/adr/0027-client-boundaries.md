# ADR 0027: Where the client boundary goes

- **Status:** Accepted
- **Date:** 2026-10-24

## Context

39 of the library's ~100 component files start with `'use client'`. A review
asked whether that many is necessary. What forces the directive, checked
against React 19.3's server build (`react.react-server.js`):

- **Missing on the server:** `createContext`, `useState`, `useEffect`,
  `useLayoutEffect`, `useRef`. Context needs `createContext`, so a provider
  or a part that reads one is a client component.
- **Present on the server:** `useId`, `useMemo`, `useCallback`, `use`,
  `cloneElement`, `Children`.
- **Props of a client component must serialise.** React's RSC renderer
  (`react-server-dom-webpack`) rejects a function prop with "Functions cannot
  be passed directly to Client Components". That made `Pagination`'s
  `getHref` impossible to pass from a Server Component, although link
  pagination is the server's case.
- **The directive covers the whole file.** Every export becomes a client
  reference, so pure parts in a client file (`AvatarGroup`, `BreadcrumbItem`)
  shipped as client components.

The bytes at stake are small: a tree-shaken component is mostly the shared
static part every component carries (Stack 2.5 kB, Table 2.65 kB), so a
Server Component saves its own few hundred bytes. Hydration is the larger
cost. It was measured: the HTML server-rendered, then `hydrateRoot` timed to
its first commit, Chromium at 4× CPU throttling, medians of 15 alternating
runs. Each library tree was compared with the same markup as plain elements,
which is what a Server Component hands the browser:

| Tree                                 | Client parts | Plain elements | Saved              |
| ------------------------------------ | ------------ | -------------- | ------------------ |
| Table, 500 rows × 5 columns          | 69.8 ms      | 52.4 ms        | 17 ms (25%)        |
| 60 Fields, each a Select or Textarea | 42.0 ms      | 35.4 ms        | 7 ms (0.1 ms each) |

## Decisions

### 1. Remove the boundary where it costs no behaviour

- **Table** (all seven parts) is a Server Component. Its stacked mode
  needed a context only so each part knew whether to add explicit roles, so
  every table now carries them (ADR 0007, addendum).
- **Pagination** with `getHref` and a controlled `page` is a Server
  Component: `getHref` and `labels.page` run on the server. Buttons, and
  links that track their own page, render the client `PaginationState`
  exactly as before. The URL holds the page in link mode, so a server render
  always has it.
- **Pure parts move out of client files:** `Avatar/AvatarGroup.tsx` and
  `Breadcrumbs/BreadcrumbItem.tsx`. A folder may hold more than one file;
  the barrel exports each.
- **Handlers that only forward a callback attach only when given one.** A
  Server Component can't pass the callback, so the element gets no function,
  as `Button` and `Collapsible` already do. This pays only when the
  component is useful without one: `ActionSelect` requires `onAction`, so a
  Server Component can never render it, and it stays a client component.

### 2. Keep Field's context

Field wires its control through context (ADR 0003). Handing the props down
by cloning, as Accordion does, would make ten controls Server Components,
but a control inside a component of your own would lose its label,
description and error wiring with no error. That is a silent accessibility
regression for about 0.1 ms of hydration per field. Revisit only if a real
page measures otherwise.

### 3. Keep the rest on the client

- **Interactive by nature:** Menu, Tabs, Combobox, NumberField, MaskedInput,
  OtpField, ColorPicker, Diff, Toast, ScrollCarousel, Rating, Countdown, ScrollSpy,
  Dialog, Tooltip.
- **Needs context to find its partner:** SidebarLayout and SidebarTrigger
  (a trigger sits deep inside an AppBar), ThemeProvider (an inherited theme).
- **Not converted, despite CSS-only versions:** Chip, Swap, ToggleButton and
  Breadcrumbs as styled checkboxes, and Avatar's fallback as a background
  image. Each changes what a screen reader announces or drops lazy loading.
- **Waits on browsers:** invoker commands with `closedby` (Dialog),
  `interestfor` (Tooltip), `scroll-target-group` (ScrollSpy) and
  `::scroll-marker` (ScrollCarousel), until every engine the library supports
  (ADR 0013) ships them.

## Consequences

- **Tests:** `src/test/serverProps.ts`'s `functionProps` now also lists
  functions handed to a component that isn't named as a server one, since
  that is a client component and its props must serialise. Table,
  Pagination, AvatarGroup and BreadcrumbItem each have a test
  that their server render hands on no function.
  `components/directives.test.ts` still fails a file without the directive
  that needs it.
- **A new client part** goes in its own file when the rest of the component
  is pure, and a component splits into a server path and a client part only
  when the server path has a real use (Pagination's links), never just to
  remove a directive.
