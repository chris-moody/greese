---
'@greese/ui': minor
'@greese/react': minor
---

- **Three-dimensional effects:** base `turnX`, `turnY`, `hinge` and `depth` (a `transform` with its own perspective), and the combos `flipUp`, `flipDown`, `flipLeft`, `flipRight`, `flipOut<Dir>` (each its entrance reversed), `depthIn`, `depthOut`, `swingIn` and `swingOut`. Overlays leave with them: an exit now carries `transform` (and a swing's pivot), and the floating styles transition it.
- **`xl` radius (24px)** on the radius scale.
- **Shaped cards transition `translate` only when interactive**, as unshaped ones do, so the runtime's effects (a pocket's mask) stay in step with them.
