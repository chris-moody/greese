// The whole library's styles come with it (styles/library.ts).
import './styles/library.ts'
// Everything below the first screen, in one chunk: the first screen loads
// without it, and it arrives while the hero is already painted.
export { Footer } from './sections/Footer.tsx'
export { Gallery } from './sections/Gallery.tsx'
export { MotionLab } from './sections/MotionLab.tsx'
export { Optimizations } from './sections/Optimizations.tsx'
export { Size } from './sections/Size.tsx'
export { Speed } from './sections/Speed.tsx'
export { Start } from './sections/Start.tsx'
export { Why } from './sections/Why.tsx'
