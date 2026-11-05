---
'@greese/icons': minor
'@greese/ui': minor
---

- **138 icons**, taking `@greese/icons` from 52 to 190. They come from porting a
  real app off another icon set, so they are the ones an application interface
  actually reaches for rather than a guess at a useful set: arrows and chevrons
  in all four directions, playback (`Play`, `Pause`, `Stop`, `PlayCircle`,
  `StopCircle`, `SkipBack`, `Volume`, `VolumeOff`, `Timer`, `Hourglass`),
  status (`CheckCircle`, `CloseCircle`, `AlertCircle`, `Warning`, `Block`,
  `PlusCircle`, `MinusCircle`), shapes (`Circle`, `CircleFilled`, `Rectangle`,
  `Triangle`, `Hexagon`, `PlusSquare`, `MinusSquare`), text formatting
  (`Italic`, `Underline`, `Strikethrough`, `AlignLeft`, `AlignCenter`,
  `AlignRight`, `AlignJustify`), layout (`Grid`, `GridOff`, `Columns`, `Rows`,
  `Fullscreen`, `FullscreenExit`, `ZoomIn`, `ZoomOut`), and
  `Eye`, `EyeOff`, `Lock`, `LockOpen`, `Link`, `LinkOff`, `ExternalLink`,
  `Code`, `Braces`, `Brackets`, `DotsVertical`, `Grip`, `SwapHorizontal`,
  `SwapVertical`, `SearchOff`, `ChevronUp` — and the rest of what an app's
  chrome needs: `Pencil`, `Share`, `Users`, `Image`, `Palette`, `Brush`,
  `Refresh`, `Undo`, `Redo`, `Loop`, `History`, `Flag`, `Flask`, `Ruler`,
  `Move`, `Target`, `Globe`, `Camera`, `Film`, `MusicNote`, `Playlist`,
  `BarChart`, `LineChart`, `Timeline`, `Gradient`, `PaintBucket`, `Eyedropper`,
  `Wand`, `Sparkle`, `Pin`, `PinFilled`, `HeartFilled`, `ThumbUp`, `ThumbDown`,
  `Trophy`, `Fire`, `Gift`, `Robot`, `Brain`, `Face`, `FaceSad`, `Gamepad`,
  `Wrench`, `Bug`, `Anchor`, `Chip`, `Coin` and more.

  All line art on the existing 16 × 16 grid at the set's own stroke, so they sit
  beside the originals. The docs' icon gallery is built from the exports, so
  they appear there with no page to write.

- **A test over the whole set**: every icon renders, draws at least one path,
  and its path data starts with a move and holds only path syntax. The file is
  hand-authored, and a typo makes a path the browser silently drops.

- **`touch-action-*` and `scrollbar-width-*` utility classes** (`@greese/ui`),
  in the effects group beside `cursor` and `user-select`. Both are whole-element
  concerns a dense interface needs and had to reach for a stylesheet for: a tool
  surface that pans and zooms has to stop the browser scrolling it, and a panel
  that scrolls inside a packed layout needs its scrollbar out of the way.

- **Budget raised deliberately:** `icons: every icon` 2.35 → 7 kB (6.66 kB
  measured), because the set nearly quadrupled. `icons: one icon, tree-shaken`
  is unchanged at 400 B (386 B measured), which is the budget that matters to a
  consumer — importing one icon still costs one icon, and the PURE marks keep
  it that way.
