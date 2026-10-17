# Changesets

Every PR that changes a published package (`@sauce-ui/react`, `@sauce-ui/tokens`)
adds a changeset:

```bash
npm run changeset
```

Both packages are versioned together (`fixed` in `config.json`). On merge to
`main`, the release workflow opens a "Version Packages" PR. Merging that PR
publishes to npm.
