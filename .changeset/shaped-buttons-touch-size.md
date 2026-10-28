---
'@greese/ui': patch
---

**Shaped buttons keep their size on touch screens.** Under Bevel, Ticket, Ridge and Folio, buttons and chips no longer grow to 44 × 44px on coarse pointers, so a theme never changes layout (a phone header's icon buttons ran off the screen). The shape's border no longer draws offset across a button on touch screens: it reset `inset` but kept the touch target's `translate` and size. `ShapeTarget`'s `touch` option still grows an element that asks for it.
