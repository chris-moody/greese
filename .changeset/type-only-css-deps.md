---
'@greese/react': patch
---

A component's stylesheet (`@greese/react/css/<Name>.css`) no longer imports the stylesheets of components it only takes types from: `Switch.css` stopped pulling in `Button.css` because Switch imports `ControlSize` from Button.
