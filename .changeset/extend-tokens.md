---
'@greese/ui': minor
---

Add tokens the system doesn't have: `greese.tokens((), $extend: (color: (brand-ink: …), space: (9: 4rem)))` in the SCSS kit and `createTheme({ extend })` declare `--greese-<group>-<name>` (a color in both schemes), and `token()` and component variables accept them afterwards. Names that already exist and unknown groups still fail.
