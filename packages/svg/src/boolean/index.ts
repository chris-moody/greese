/**
 * `@greese/svg/boolean`: path booleans that keep curves. `subtractPath`
 * cuts one path's area out of another and gives back one path, holes and
 * separate pieces as its subpaths. An entry of its own, so `@greese/svg`'s
 * budget doesn't carry it (ADR 0041).
 */
export { subtractPath, type SubtractOptions, type SubtractResult } from './subtract.ts'
