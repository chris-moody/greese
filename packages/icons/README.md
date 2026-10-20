# @greese-ui/icons

A small set of line icons as React components. Optional: GreeseUI takes any
icons, from any set, and doesn't depend on this package.

```sh
npm install @greese-ui/icons
```

```tsx
import { IconButton } from '@greese-ui/react'
import { SearchIcon } from '@greese-ui/icons'

<IconButton label="Search"><SearchIcon /></IconButton>
```

- **Sized to text** (`1em`) and drawn in `currentColor`, so they fit buttons,
  links and text with no CSS. `size` and `strokeWidth` change that.
- **Decorative by default** (`aria-hidden`): name the control around the
  icon. Give one a `title` when it stands alone and means something.
- **Tree-shakable:** one export per icon.
- **Make your own** with `createIcon(name, d)`, from 16 × 16 line art.

Icons: ArrowRight, Bell, Check, ChevronDown, ChevronRight, Close, Document,
Folder, Heart, Home, Info, Menu, Moon, Plus, Search, Star, Sun, Trash, User.
