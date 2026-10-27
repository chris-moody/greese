# Test dashboard

A local tool for auditing the test suites: it runs the repo's existing Vitest
and Playwright suites in a separate process, shows progress live, and reports
how long the run, each suite, each file and each test took, which files each
test file involves, and signals of redundant or wasteful tests.

```bash
npm run test:dashboard     # http://localhost:4410 (PORT=… to change)
```

- Lives outside the npm workspaces: no build, lint or publish includes it,
  and it has no dependencies of its own.
- Runs the suites one at a time with their own configs; two reporters
  (`reporters/`) stream results back. Unit runs skip coverage.
- e2e and visual suites build and serve their apps as their Playwright
  configs say; tick "Build packages first" if `dist/` may be stale.
- Each run is saved to `reports/<timestamp>.json` (gitignored) and can be
  reopened from the Report menu or exported.
- It listens on localhost only and runs only the suites listed in
  `server.mjs`.
