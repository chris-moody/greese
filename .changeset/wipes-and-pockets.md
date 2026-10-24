---
'@greese/ui': minor
'@greese/react': minor
---

Add built-in effects that reveal or hide with a mask, so they compose with a shape's clip-path:

- **Wipes:** `wipe<Dir>` and `wipeOut<Dir>` in eight directions (`Right`, `Left`, `Up`, `Down`, `DownRight`, `DownLeft`, `UpRight`, `UpLeft`), plus `wipeOpenX/Y` and `wipeCloseX/Y` from and to the middle.
- **Irises:** `irisIn` and `irisOut` from and to the middle, and `iris<Dir>` and `irisOut<Dir>` in the same eight directions, an opening in the element's proportions that closes toward that side or corner, or opens from it (each entrance is its exit reversed). Every iris opens to 142%, just past the far corner, so the whole run is visible change.
- **Pockets:** `pocket<Dir>` and `pocketOut<Dir>` in the same eight directions, which rise out of, or sink into, a slot at one of the element's own edges.

The leaving ones are overlay exits too: an overlay (Dialog, Drawer, Popover, Menu, Tooltip, Sidebar, SpeedDial) holds the exit's mask as it closes. An exit now sets everything an overlay moves to (`translate`, `scale`, `opacity` and its mask), so what it doesn't move stays put. Mask images use `black` and `transparent`, which survive the runtime's value mixing.
