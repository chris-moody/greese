---
'@greese/ui': minor
'@greese/react': minor
---

New effects: `slideDown`, `slideRight`, `slideLeft`, `popIn` (CSS presets), `popOut`, and `fall`, the opposite of `rise`. `lift` is now `rise`, and `pop` no longer fades (`popIn` does). A negative number in a sequence (`'slideUp,-0.2,popIn'`) backs the next step up so it overlaps the last. A scope takes `replay`: change it and its entrances play again in place, without remounting. An `inView` scope that was already on screen is no longer left held.
