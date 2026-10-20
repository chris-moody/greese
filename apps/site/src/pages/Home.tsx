import { lazy, startTransition, Suspense, useEffect, useState, type JSX } from 'react'
import { Hero } from '../sections/Hero.tsx'
import { Stats } from '../sections/Stats.tsx'
import { useShell } from '../shell.ts'

type Below = typeof import('../below.ts')

/** A section from the below-the-fold chunk, fetched the first time one renders. */
const fromBelow = (name: keyof Below) =>
  lazy(() => import('../below.ts').then((m) => ({ default: m[name] })))

/** Below the hero, in page order. */
const sections = (
  ['Why', 'Size', 'Speed', 'Optimizations', 'MotionLab', 'Gallery', 'Start'] as const
).map(fromBelow)
const Footer = fromBelow('Footer')

/**
 * How many of `sections` are mounted. They mount one per task after the
 * first paint: rendering and committing the whole page at once was one long
 * main-thread task (hundreds of ms on a mid-range phone), and each section
 * alone stays short. They're off screen, so nothing visibly shifts.
 */
const useProgressive = (total: number): number => {
  const [mounted, setMounted] = useState(0)
  useEffect(() => {
    if (mounted >= total) return
    const timer = setTimeout(() => startTransition(() => setMounted((n) => n + 1)))
    return () => clearTimeout(timer)
  }, [mounted, total])
  return mounted
}

/** The homepage. "Replay motion" remounts it, so every entrance plays again. */
export const Home = (): JSX.Element => {
  const { replay } = useShell()
  // One more step than sections: the footer comes last.
  const mounted = useProgressive(sections.length + 1)
  return (
    <div key={replay}>
      <Hero />
      <main id="main">
        <Stats />
        <Suspense>
          {sections.slice(0, mounted).map((Section, i) => (
            // A fixed list in a fixed order, so the index is a stable key.
            <Section key={i} />
          ))}
        </Suspense>
      </main>
      <Suspense>{mounted > sections.length && <Footer />}</Suspense>
    </div>
  )
}
