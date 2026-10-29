---
'@greese/react': minor
---

**Page transitions (ADR 0029).** `PageTransition` animates page changes with React 19.3's `<ViewTransition>` and greese's effects: the motion theme's page roles by default, or named effects per direction (`back`) and per transition type (`types`), and selector `rules` for parts of a page. `usePageNavigate(navigate)` takes any router's navigate and adds the transition types (`greese-page`, `greese-forward`/`greese-back`, `greese-deeper`/`-shallower`/`-sibling`), with `onLinkClick` for a router's links. `PageShare` morphs an element into its twin on the next page. `PageTransition` and `PageShare` are Server Components; before React 19.3 they render their children unchanged.
