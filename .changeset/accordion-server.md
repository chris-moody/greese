---
'@greese/react': minor
---

**`Accordion` and `AccordionItem` are Server Components:** an FAQ ships no JavaScript. The Accordion hands its `name` (with `exclusive`) and its icons to the `AccordionItem`s among its children, in fragments and lists too, instead of through context. **Changed:** an `AccordionItem` inside a component of your own no longer picks them up; give it `name` and icons as its own props.
