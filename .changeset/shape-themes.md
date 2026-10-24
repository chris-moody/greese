---
'@greese/ui': minor
---

Add shapes (ADR 0024). `@greese/ui/shapes` is a build-time compiler: each shape is points anchored to the box, in percentages, pixels and named parameters. It compiles to one clip and a border ring from the same geometry. Registered `@property` parameters animate hover, press, focus and entrance, so borders never come apart from the shape and transforms carry both.

It also ships presets (bevel, notch, tag, hexagon, slant, dog-ear, ticket, zigzag, shield) and four shape themes, `@greese/ui/themes/{bevel,ticket,ridge,folio}.css` (and `.scss`), for any color theme. Each shape is a `greese-shape-<name>` class too.
