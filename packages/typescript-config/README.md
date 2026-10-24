# @greese/typescript-config

Shared compiler settings. Every app and package extends one of these.

| Config               | For                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `base.json`          | Anything TypeScript                                                                                                            |
| `library.json`       | Published packages: relative imports carry `.ts`/`.tsx` extensions, rewritten to `.js` on emit so the output is valid Node ESM |
| `react-library.json` | `library.json` + `jsx: react-jsx`                                                                                              |
| `node.json`          | Node scripts                                                                                                                   |

```json
{ "extends": "@greese/typescript-config/react-library.json" }
```

`base.json` sets `noUncheckedIndexedAccess: true`. Handle `undefined` from
indexing rather than asserting it away.
