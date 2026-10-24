---
'@greese/ui': minor
'@greese/react': minor
---

Themes reassign roles; they never overwrite tokens or effects (ADR 0025).

- **Radius roles:** components read `--greese-corner-control`, `-field`, `-surface`, `-panel`, `-inset`, `-pill` and `-round` (the `corner` token group), each pointing at the radius scale, instead of the scale itself. A shape theme points the roles at `none`; `--greese-radius-md` stays 8px.
- **Motion roles:** the kit's `motion-defaults()` assigns which effect plays where and which timing it takes: `theme` (the new `greese="theme"` entrance), `content` (tab panels' and an opening accordion's children), `rows` (table rows, a stagger apart; none by default), `toast`, `backdrop`, the overlay roles and their exits, `*-duration` (a duration token by name, or a time) and `enter-ease`/`exit-ease` (an easing token by name, or a curve). Effect names are checked, and the kit carries the assigned entrances' own keyframes.
- **Built-ins keep their keyframes:** `defineGreeseEffect()` under a built-in's name is never played, and the kit's `effect()` and `keyframes()` refuse one. Name your effect and assign it instead.
- **`'theme'`** is a `greese` entrance (`enter`, `inView`) that plays whatever the theme assigns, `fadeUp` in the base theme.
