---
'@greese/authoring': minor
---

Zoom the stage with the wheel at the pointer, and pan sideways or with Shift, as Pixels does: `StageHost` and `AuthoringView` do it by default (`wheelZoom={false}` turns it off) through a backend's new `zoomBy` and `panBy`, and `useWheelZoom` and `wheelGesture` give any stage the same rules. Add `ColorTool`, Pixels' fill and stroke swatches with swap and reset, and `GridOverlay`, a reference grid laid out as the rulers and guides are. `ComplexColorField` takes `allowGradient` and `allowCurrentColor`, and `paintCss` paints a swatch.
