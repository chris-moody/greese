# ADR 0015: New tokens

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

The SCSS kit stops the build on a token name the system doesn't have
(`no radius token huge`), which catches typos. But a theme sometimes needs a
token of its own: a brand ink, a ninth spacing step, a glow shadow, and Theme
Studio had no way to add one.

## Decision

Adding is explicit, never a side effect of a typo.

- **Kit:** `greese.tokens($overrides, $extend: …)`. `$extend` has the shape of
  the overrides (`group: (name: value)`; a color takes one value or a
  light/dark pair). Each becomes `--greese-<group>-<name>`, in both schemes
  for a color. A name the system already has, an unknown group, or a name that
  isn't a kebab-case word still stops the build. Added names are registered,
  so `token()` and component variables accept them afterwards (and only
  then).
- **`createTheme({ extend })`** does the same for a static theme, with the same
  refusals and the usual unsafe-value check.
- **Theme Studio:** every token section has an "Add a … token" row. The spec
  stays `tokens.<group>.<name>`: the generator treats a name the system lacks
  (in a group it has) as an extension and writes `$extend`, and the importer
  reads such variables back as added tokens, so the round trip holds. The
  preview measures added colors like the built-in ones.

### Limits

- **No new groups.** A group is an area of the system with meaning (space,
  radius, font…); adding one would need components to use it.
- **`space` tokens are variables only.** Responsive classes (`gap-9`) are
  generated when the stylesheet is built, from the built-in keys. A build can
  extend them in the same way breakpoints can (ADR 0006 §2), but a theme can't.
- **Not typed.** Added tokens aren't in TypeScript's token types; read them
  through their custom properties.

## Consequences

- The checks that matter keep their strictness: typos still fail.
- Themes, SCSS and Studio files can carry brand-specific tokens without a fork.
- The typography system (planned) uses this to add its variant tokens.
