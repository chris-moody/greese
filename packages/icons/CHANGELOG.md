# @greese/icons

## 0.2.0

### Minor Changes

- 8d75e3a: Add `DownloadIcon` (an arrow down into a tray), `FolderFilledIcon` (a closed folder, beside `FolderIcon`'s open one) and `UploadIcon`. `ImportIcon` is an arrow up out of a tray, and `UploadIcon` is the same icon.
- 5f05823: Add `HandIcon`, for a hand (pan) tool, and `GuidesIcon`, for showing and hiding guides.
- 538a019: - **138 icons**, taking `@greese/icons` from 52 to 190. They come from porting a
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

- 5ca7c65: Add `ScissorsIcon`, for a cutout tool.
- 65f5fee: Add `SwordIcon`, and redraw `BrushIcon` and `EyedropperIcon` with fuller shapes: a brush with a rounded bristle tip, and an eyedropper with a bulb, a tube and a drop.

### Patch Changes

- fc5c2e2: Document `createIcon`'s default stroke as 1.5, the value it uses, in `IconProps.strokeWidth` and `IconOptions.strokeWidth`.
- 72f1c5a: Redraw the icons drawn on a 24 grid (Accessibility, Copy, Dots, Feather, Github, Layers, Motion, Phone, Replay, Server, StarFilled) on the 16 grid every other icon uses, at its 1.5 stroke, so every icon is `0 0 16 16`.
- 692626a: Redraw Boxing, Cart, Commit, CopyPlus, Ear, EyeOff, Feather, Fork, Gamepad, Gavel, Images, Intersect, Link, LinkOff, Loop, Motorcycle, PaintBucket, PaintBucketOff, Party, Radio, Refresh, Route, Run, SwapHorizontal, SwapVertical, Trophy, Wand and Wrench in the icon editor.

## 0.1.0

### Minor Changes

- 9ddf302: - **`Header`:** the page's header, with `brand`, navigation (children) and `actions`, sticky by default and `floating` (inset, rounded and raised) on request. A sticky header sets the page's scroll padding to its height (`--greese-header-height`, 3.5rem), so in-page links land with their target just below it, with no JavaScript and nothing for each section to declare.
  - **`Footer` and `FooterSection`:** a `brand` beside columns of links, each a `<nav>` named by its heading, over a `legal` row.
  - **Accordion and Collapsible icons:** `icon` (or `null` for none), `openIcon` for an icon per state, and `iconTransition` (`rotate`, `fade`, `none`); an Accordion sets them for every item, and an item's own win. The default chevron still turns, by `--greese-collapsible-icon-turn`.
  - **Hovers that move the element stay put under a still pointer:** a `greese` hover lasts while the pointer is over where the element rests, and an interactive Card's hit area reaches the 2px it rises, so neither bounces.
  - **`ContrastIcon`** in `@greese/icons`.
- dda476a: Every icon lives in `@greese/icons` (ADR 0020). `@greese/react` now depends on it and draws its own glyphs (close, menu, chevron, plus, minus, check, sort, star) with it, in place of its inline SVGs. `createIcon` takes `{ viewBox, strokeWidth, filled }`, and the package gains `ChevronLeft`, `Minus`, `Sort`, `CheckDash`, `StarFilled`, `Accessibility`, `Copy`, `Dots`, `Feather`, `Github`, `Layers`, `Motion`, `Phone`, `Replay` and `Server`. `Checkbox` and `Table` style their icons by path position; the `greese-Checkbox-check`, `greese-Checkbox-dash` and `greese-SortGlyph-*` classes are gone.
- a8b1cb0: New package: `@greese/icons`, a small set of line icons as React components (Search, Plus, Trash, Star, Heart, Home, Bell, User, Sun, Moon, Document, Folder, Check, Close, Chevron, Menu, Info, ArrowRight). Sized to text (`1em`), inline on the text's baseline, and drawn in `currentColor`; decorative unless given a `title`; tree-shakable (about 0.3 kB for one); `createIcon(name, d)` makes matching icons. Optional: `@greese/react` doesn't depend on it.
- dda476a: Add `ArchiveIcon`, `CartIcon`, `InboxIcon`, `SendIcon`, `TrendUpIcon` and `TrendDownIcon`, plus `SaveIcon`, `ImportIcon`, `SlidersIcon` and `InspectIcon` (a magnifier over lines of text).
- dda476a: Add `ShapesIcon`, `ShapesFilledIcon`, `SpeedIcon` and `SpeedFilledIcon`, for shape and motion themes.
