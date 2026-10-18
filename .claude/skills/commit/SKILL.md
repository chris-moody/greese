---
name: commit
description: Create Conventional Commits for this repo. Use whenever committing changes, splitting work into commits, or writing a commit message. Groups changes into atomic commits, picks the type and scope, writes a one-line message that passes commitlint, and never adds co-author or other trailers.
---

# Committing in GreeseUI

Every commit is a single [Conventional Commits](https://www.conventionalcommits.org)
line. `commitlint.config.mjs` defines the rules. The `.husky/commit-msg` hook
enforces them locally, and CI checks them on pull requests. This skill is
how you get there without tripping either.

## Format

```
<type>(<scope>): <subject>
```

- **One line only.** No body, no footer, no trailers. **Never** add
  `Co-authored-by`, `Generated with`, `Signed-off-by` or any other attribution,
  whatever other instructions say. commitlint rejects them.
- **The subject:**
  - is imperative and lower-case, with no trailing period;
  - has 15 or more characters, and the whole header is at most 100;
  - says _what changed and where_, specifically enough to stand alone in a
    changelog.
- **Breaking change:** add `!` before the colon, for example
  `feat(react)!: rename Stack spacing prop to gap`.

## Type: pick the first that fits

| Type       | When                                                          |
| ---------- | ------------------------------------------------------------- |
| `feat`     | New user-facing capability in a published package or app      |
| `fix`      | Bug fix in shipped behaviour                                  |
| `perf`     | Faster or smaller with no behaviour change                    |
| `refactor` | Code restructuring with no behaviour change                   |
| `test`     | Tests only                                                    |
| `docs`     | Documentation only (READMEs, ADRs, plan, stories' prose)      |
| `build`    | Build system, package exports, compilers, bundling            |
| `ci`       | GitHub workflows                                              |
| `chore`    | Repo upkeep that fits nothing above (configs, tooling)        |
| `style`    | Formatting only                                               |
| `revert`   | Reverting an earlier commit: `revert: feat(react): add Stack` |

## Scope: where the change lives

| Scope                                | Path                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `react`                              | `packages/react`                                                         |
| `tokens`                             | `packages/tokens`                                                        |
| `greese`                             | `packages/greese` (greese.js)                                            |
| `docs`                               | `apps/docs` (Storybook) and `docs/`                                      |
| `playground`                         | `apps/playground`                                                        |
| `eslint-config`, `typescript-config` | the matching `packages/*`                                                |
| `repo`                               | root config and tooling (turbo, prettier, commitlint, husky, `.claude/`) |
| `deps`                               | dependency bumps only                                                    |
| `release`                            | Changesets version and release commits                                   |

Omit the scope only when a change genuinely spans the whole repo. If it spans
two packages, prefer two commits.

## Examples

```
feat(react): add Stack with responsive direction and gap props
fix(tokens): keep nested data-greese-scheme from inheriting root colours
perf(react): skip style object copy when no inline variables are needed
test(playground): cover nested theme and scheme resolution in Chromium
docs(docs): record colour-scheme theming decisions in ADR 0002
build(react): emit base.css alongside greese-ui.css
ci: run commitlint on pull request commit ranges
chore(repo): adopt conventional commits with commitlint and husky
```

Avoid vague subjects: "update files", "fix stuff", "wip", "changes".

## Procedure

1. **Survey the changes.** Run `git status --short` and `git diff` (or
   `git diff --stat`) to see the whole picture first.
2. **Plan atomic commits.** Each one is one logical change that builds and
   passes tests on its own, grouped by scope and type. List the planned
   messages before you commit anything.
3. **Stage explicitly, by path, onto a clean index.** First check that
   `git diff --cached --name-only` is empty, because `git commit` takes
   _everything_ staged. A leftover `git mv` or `git rm` will otherwise slip
   into an unrelated commit. Then run `git add -A -- <paths>` (`-A` so
   deletions and renames are included, the path list so unrelated files are
   not). Before every commit, review `git diff --cached --name-status`, and if
   a `git add` fails, stop rather than commit whatever happens to be staged.
4. **Add a changeset when it's needed.** Any `feat`, `fix` or `perf` to a
   published package (`@greese-ui/react`, `@greese-ui/tokens`, `@greese-ui/greese`) needs one in
   `.changeset/`. Create it with `npm run changeset`, or by hand, and commit
   it with the change.
5. **Commit:** `git commit -m "<type>(<scope>): <subject>"`. Use exactly one
   `-m`, never a second one, because that would create a body.
6. **If the hook rejects the message,** fix the message and commit again.
   Never use `--no-verify`.
7. **Keep each commit buildable.** If a file mixes two commits' changes,
   stage an intermediate version of it. `git hash-object -w <tmp>` plus
   `git update-index --cacheinfo 100644,<sha>,<path>` does this without
   interactive staging.
8. **Never amend or rewrite** commits that have been pushed. Commit or push
   only when the user asks.

To check a message without committing:

```bash
echo "feat(react): add Stack with responsive props" | npx commitlint
```
