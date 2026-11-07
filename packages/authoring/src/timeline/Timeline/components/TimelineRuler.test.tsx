import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { TimelineRuler } from './TimelineRuler.tsx'
import { createAuthoringStore } from '../../../state/createAuthoringStore.ts'
import type { TimelineResolution } from '../../../core/types/resolution.types.ts'
import { TimeDomain, TimeMode } from '../../../core/types/resolution.types.ts'

// Mock selector
vi.mock('../../../state/selectors.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../state/selectors.ts')>()),
  selectFrameCount: () => 100,
}))

const mockResolution: TimelineResolution = {
  domain: TimeDomain.Frames,
  ticksPerUnit: 1,
  tickToSeconds: (tick: number) => tick,
  secondsToTick: (seconds: number) => seconds,
  unitToTicks: (unit: number) => unit,
  ticksToUnit: (tick: number) => tick,
  format: (tick: number) => `${tick}`,
  getSnapPoints: (range) => {
    const points = []
    // On absolute multiples, as a real resolution's grid is, whatever the window.
    for (
      let tick = Math.ceil(range.startTick / 10) * 10;
      tick <= range.endTick;
      tick += 10
    ) {
      points.push({ tick, weight: 0 })
    }
    return points
  },
}

const defaultProps = {
  frameWidth: 20,
  // Labels every 10 ticks need 64px between them (MIN_LABEL_PX): 10px a tick.
  pixelsPerTick: 10,
  ticksPerUnit: 1,
  resolution: mockResolution,
  timeMode: TimeMode.Frames,
  onScrubStart: vi.fn(),
  onDoubleClick: vi.fn(),
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={createAuthoringStore()}>{children}</Provider>
)

describe('TimelineRuler', () => {
  it('positions labels at constant offsets regardless of windowing', () => {
    // Render with first window (frames 0-50)
    const { container: container1, unmount } = render(
      <TestWrapper>
        <TimelineRuler {...defaultProps} firstFrame={0} lastFrame={50} />
      </TestWrapper>
    )

    const ticks1 = container1.querySelectorAll('[style*="left"]')

    unmount()

    // Render with second window (frames 25-75, overlaps first)
    const { container: container2 } = render(
      <TestWrapper>
        <TimelineRuler {...defaultProps} firstFrame={25} lastFrame={75} />
      </TestWrapper>
    )

    const ticks2 = container2.querySelectorAll('[style*="left"]')

    // Labels in the overlap region (ticks 25-50) should have identical positions
    // Extract tick values from labels to match them up
    const overlapTicks = Array.from(ticks1)
      .filter((el) => {
        const tick = parseInt(el.textContent || '0', 10)
        return tick >= 25 && tick <= 50
      })
      .map((el) => ({
        tick: parseInt(el.textContent || '0', 10),
        left: (el as HTMLElement).style.left,
      }))

    const overlapTicks2 = Array.from(ticks2)
      .filter((el) => {
        const tick = parseInt(el.textContent || '0', 10)
        return tick >= 25 && tick <= 50
      })
      .map((el) => ({
        tick: parseInt(el.textContent || '0', 10),
        left: (el as HTMLElement).style.left,
      }))

    // Same ticks, same positions: and there are some to compare.
    expect(overlapTicks.length).toBeGreaterThan(0)
    overlapTicks.forEach((entry1) => {
      const entry2 = overlapTicks2.find((e) => e.tick === entry1.tick)
      expect(entry2).toBeDefined()
      expect(entry2!.left).toBe(entry1.left)
    })
  })

  it('positions labels by tick alone, independent of scroll', () => {
    const { container } = render(
      <TestWrapper>
        <TimelineRuler {...defaultProps} firstFrame={0} lastFrame={50} />
      </TestWrapper>
    )

    const ticks = container.querySelectorAll('[style*="left"]')
    expect(ticks.length).toBeGreaterThan(0)
    ticks.forEach((el) => {
      const tick = parseInt(el.textContent || '0', 10)
      const expectedLeft = `${tick * defaultProps.pixelsPerTick}px`
      expect((el as HTMLElement).style.left).toBe(expectedLeft)
    })
  })
})
