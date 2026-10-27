# @greese/icons

Line icons as React components: every icon greese ui and its apps draw. greese ui's
components use these for their own glyphs and take any other icon you give them
from any set.

```sh
npm install @greese/icons
```

```tsx
import { IconButton } from '@greese/react'
import { SearchIcon } from '@greese/icons'

;<IconButton label="Search">
  <SearchIcon />
</IconButton>
```

- **Sized to text** (`1em`) and drawn in `currentColor`, so they fit buttons,
  links and text with no CSS. `size` and `strokeWidth` change that.
- **Decorative by default** (`aria-hidden`): name the control around the
  icon. Give one a `title` when it stands alone and means something.
- **Tree-shakable:** one export per icon.
- **Make your own** with `createIcon(name, d)`, from 16 × 16 line art (or
  `createIcon(name, d, { viewBox: 24, strokeWidth: 1.8 })` for another grid,
  `{ filled: true }` for a solid shape).
- **Every icon lives here.** greese ui's own (close, chevron, sort…) and its
  apps' are exports of this package; to add one, add it to `src/icons.tsx`.
  Don't inline an `<svg>` or write a one-off component.

Icons: see the Icons page in Storybook for the whole set.
