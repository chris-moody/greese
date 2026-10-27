---
'@greese/react': minor
'@greese/ui': minor
---

**Shape themes reach more components.** Select, Textarea and OtpField's boxes take the field shape; collapsible headers become bars that take the small shape in every shape theme; menus, popovers and tooltips draw their border along the shape; an accordion item's panel (`.greese-AccordionItem > .greese-Collapsible-content`) takes the item's shape, not the `<details>`, which no longer adds padding of its own; Bevel and Ridge's switches get a track pointed at both ends to hold their diamond knob, and their diamond radios fit inside the radio's box, so a scroller's edge no longer cuts a point off; Extrude and Tilt's accordions drop the rules between items for a gap; toasts keep their tone's edge; chat bubbles are cut to Bevel and Folio with their tail; avatars are cut squares in Bevel and rounded squares in Soft and Extrude; Folio's status dots get a fold to their size. Extrude draws a button's lower edge in a shade of its own face at 3:1 or more against it (WCAG 1.4.11), so dark buttons show their depth too; it adds depth to alerts, tabs (the current one pressed in), progress fills, the chosen segment, code boxes, collapsible headers and the speed dial. Badges are opaque in every variant (`--greese-badge-surface`), so what they're pinned to doesn't show through.

**Changed markup:**

- `Textarea` renders a frame (`.greese-Textarea`) round the textarea (`.greese-Textarea-control`), like Input: `className` and `style` go to the frame, every other prop and `ref` to the textarea.
- `FileInput` renders a frame (`.greese-FileInput`) with the native input visually hidden (`.greese-FileInput-control`), a greese ui Button as its label (`.greese-FileInput-button`) and the chosen files' names (`.greese-FileInput-files`). `className` and `style` go to the frame. New props: `buttonLabel` and `placeholder`. `--greese-file-height` and `--greese-file-padding` are gone (the Button's size sets them).
- `Menu` scrolls an inner `.greese-Menu-viewport` (`role="none"`), not itself.
- `SpeedDial`'s trigger is an IconButton and each `SpeedDialAction`'s icon a Button's look, so they take the theme's button shape, depth and states.

**New:** `Progress` takes `loading`: the filled part runs with diagonal stripes in the bar's two colors, and the bar is `aria-busy`. `ScrollSpy` follows sections that scroll in a panel of their own, measured from the panel's top.
