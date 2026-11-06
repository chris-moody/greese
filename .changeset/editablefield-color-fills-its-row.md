---
'@greese/ui': patch
---

Let an `EditableField` color swatch fill its row, like every other control.

The swatch was a 1.75rem square pinned to the end of the row while the text,
number and select rows beside it took all the slack. In a panel of fields that
read as a mistake: the one field whose whole job is to show a value you can
only see — the color itself — showed the least of it, and was the smallest
thing to hit.

It now stretches like a text field, with its old square size as a floor: the
button has no content of its own, so nothing else would stop it collapsing to
a sliver in a narrow panel.
