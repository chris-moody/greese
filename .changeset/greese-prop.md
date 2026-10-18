---
'@greese-ui/react': minor
---

Add the `greese` prop to every component that draws something: CSS-only entrance presets (also in Server Components), scroll reveals, hover/press/focus interactions, text effects (`type`, `count`, `split`), overlay exits and custom greese.js timelines, all respecting reduced motion. Adds `<Motion>`, `useTimeline()`, `resolveGreese`/`withGreese`, `css/Motion.css`, and the `@greese-ui/react/greese` opt-in that loads the runtime up front; otherwise it loads lazily on first use.
