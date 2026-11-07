---
'@greese/js': minor
---

Add editor playback to timelines (ADR 0036): `fps` draws only whole frames while time stays in seconds, `bounds(start, end, { loop })` plays between two times or labels and loops there carrying the overshoot, and `ticker: false` lets a host's own clock advance a playing timeline with `tick(dt)`.
