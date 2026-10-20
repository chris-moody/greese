/**
 * Conventional Commits, enforced on every commit by the .husky/commit-msg hook
 * and on pull requests by CI. The how-to lives in .claude/skills/commit/SKILL.md.
 *
 * House rules beyond the conventional preset:
 *   - one line only: no body, no footer, no trailers (Co-authored-by included);
 *   - scopes come from a fixed list mirroring the workspace;
 *   - subjects are specific enough to stand alone in a changelog.
 *
 * Breaking changes use `!` in the header: `feat(react)!: rename Stack spacing to gap`.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'perf',
        'refactor',
        'docs',
        'test',
        'build',
        'ci',
        'chore',
        'style',
        'revert',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'ui',
        'react',
        'js',
        'icons',
        'docs',
        'playground',
        'site',
        'studio',
        'eslint-config',
        'typescript-config',
        'repo',
        'deps',
        'release',
      ],
    ],
    'header-max-length': [2, 'always', 100],
    'subject-min-length': [2, 'always', 15],
    'body-empty': [2, 'always'],
    'footer-empty': [2, 'always'],
    'trailer-exists': [2, 'never', 'Co-authored-by:'],
  },
}
