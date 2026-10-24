---
'@greese/ui': minor
'@greese/react': patch
---

- **`--greese-radius-round` token (`50%`)**, which the `round` radius role points at: knobs, thumbs, radios, step markers, avatars and status dots read the role, so a theme can square them.
- **Tab panels and accordion content stay put** while their children enter, a stagger apart.
- **Segmented control:** icons in a segment are centered with its text.
- **AvatarGroup:** the group's `size` now applies to its avatars (each avatar's own size used to win), and it shows the one avatar left over instead of "+1".
