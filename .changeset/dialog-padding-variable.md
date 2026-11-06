---
'@greese/ui': patch
---

Let `--greese-dialog-padding` set a dialog's or drawer's inset. The base rule
already read it, but every drawer placement and the full-size dialog set
`padding-block` separately from the raw `--greese-space-5`, so the variable had
no effect on exactly the surfaces that most often want to run edge to edge — a
navigation drawer whose rows are full-width targets. Each of those now reads the
variable too.

Set, it is the padding verbatim; unset, the default still keeps a full-height
drawer's content clear of a notch or a home indicator, so an app that opts into
`0` is opting out of that floor as well.
