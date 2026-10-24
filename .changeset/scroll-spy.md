---
'@greese/react': minor
'@greese/ui': minor
---

Add ScrollSpy: the same-page `#id` links inside it get `aria-current="location"` while their section is the one the page is scrolled to (the last one above `offset`, or the last at the bottom of the page), and `onActiveChange` reports its id. Works with any router's links; `currentSection()` is exported.
