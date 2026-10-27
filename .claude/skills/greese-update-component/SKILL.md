---
name: greese-update-component
description: Procedure for changing an existing GreeseUI component (props, behaviour, a11y, styles) without breaking consumers, and for keeping stories, tests, baselines, docs and ADRs in sync. Use when the user asks to fix, extend, refactor or restyle a component, or reports a component bug.
---

# Changing an existing GreeseUI component

Load `greese-conventions` first.

## 1. Understand before editing

- Read the component, its stylesheet, its tests (search
  `packages/react/src/components/*.test.tsx` for `describe('<Name>'`), its
  story, and its e2e coverage (search `apps/playground/e2e` for the name).
- Read the ADR for its area. If the change contradicts an ADR, stop and ask,
  or write a superseding ADR. Never silently diverge.
- For a bug, reproduce it first: a failing unit test, or an e2e assertion
  when it's layout or browser behaviour. Ports and stories have found
  real bugs this way (Hide ranges, missing stylesheets).

## 2. Classify the change (semver)

| Change                                                                                                        | Bump             | Notes                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bug fix, visual fix, a11y fix                                                                                 | patch            | Visual changes still need new baselines                                                                                                                           |
| New optional prop, new variant, new export                                                                    | minor            |                                                                                                                                                                   |
| Renamed or removed prop, changed default, changed DOM structure that users style, a changed public class name | **major**: avoid | Prefer adding the new and deprecating the old with a TSDoc `@deprecated` and a dev-only warning; remove it in the next major. `feat(react)!:` if it's unavoidable |

Public surface means:

- props;
- exported helpers and types;
- `greese-<Name>` and `greese-<Name>--<modifier>` classes;
- documented `--greese-<name>-*` variables;
- `data-*` attributes documented for styling.

Internal parts (`greese-<Name>-<part>`) may change in a minor release.

## 3. Make the change

- Keep TSDoc accurate, `@default`s included; Storybook's props table reads
  it.
- Styling changes follow `greese-styles`.
- Keep both the controlled and uncontrolled paths, and Field wiring, working.
- Don't grow the component's size budget without a reason. Measure before
  and after (`npm run size -w @greese/react`).

## 4. Keep everything in sync

| If you changed…         | Also update                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Behaviour               | Unit tests (and e2e if it's browser-level), following `greese-testing`                                                   |
| Rendering or styles     | The story if needed, and **visual baselines** (`--update-snapshots -g "<story-id-prefix>"`); look at the new screenshots |
| Props                   | The story's `args`/`argTypes`, the README if listed, and the MUI migration table if relevant                             |
| Component CSS variables | The Theming guide's per-component table                                                                                  |
| A documented decision   | The ADR (amend it, or add a superseding one) and ADR 0013's phase table                                                  |
| Anything shipped        | A changeset with the right bump                                                                                          |

## 5. Verify and commit

Run the `greese-verify` gates. Commit with the `commit` skill:

- `fix(react)` for a fix;
- `feat(react)` for a feature;
- `refactor(react)` for no behaviour change;
- `perf(react)` for smaller or faster.

Put baselines in their own `test(playground)` commit.

## Writing an ADR

Write one when a decision constrains future work: a new pattern, a rejected
alternative worth remembering, a budget raised, or a platform API chosen
over a library.

- **File:** `docs/adr/NNNN-kebab-title.md`, numbered next in sequence.
- **Sections:** Status / Date / Context / Decisions (numbered, each with its
  reason) / Consequences (sizes, tests, docs).
- **Style:** short, concrete, and naming the tests that prove it.
- **Link it** from ADR 0013's phase table, and from the conventions skill's
  ADR table if it governs an area.
