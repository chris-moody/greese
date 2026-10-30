---
'@greese/react': patch
'@greese/ui': patch
---

Page transitions: a live exit's styles come off when the new page has committed, not two frames after the exit, so members no longer flash back on the old page. A page that left live still plays the new page's entrance, over what the exit left of the old one fading out. A page's snapshots show only the screenful in view, so effects sized by the element (pockets, pops, flips) play on screen rather than across the whole page's height. What stays still while a page changes (a header named `'still'`) stays on top, so the page moves beneath it. New effects `flipOver<Dir>` and `flipOverOut<Dir>` turn half over with the back face hidden: a pair played together turns as one panel, the old page on its front and the new one on its back.
