import { useEffect, useState, type JSX } from 'react'
import { Button, Dialog } from '@greese/react'
import { EditableField } from '@greese/react'
import { DialogFields } from '../../../panels/panelParts.tsx'
import {
  stampEnvelope,
  stampPulse,
  type StampedCurve,
} from '../../../core/timeline/curvePresets.ts'

export type ApplyCurveMode = 'pulse' | 'envelope'

export interface ApplyCurveDialogProps {
  /** `null` closes the dialog. */
  mode: ApplyCurveMode | null
  /**
   * Initial tick range — the current cell selection's span, or a single
   * point (`initialStartTick === initialEndTick`) when there's none. Both
   * remain editable in the dialog (a single-point default is rarely the
   * intended curve length), so this is a starting point, not a constraint.
   */
  initialStartTick: number
  initialEndTick: number
  onClose: () => void
  onApply: (result: StampedCurve) => void
}

interface PulseParams {
  cycles: number
  baseline: number
  amplitude: number
}

interface EnvelopeParams {
  attackTicks: number
  decayTicks: number
  sustainTicks: number
  releaseTicks: number
  peak: number
  sustainLevel: number
  baseline: number
}

const DEFAULT_PULSE: PulseParams = { cycles: 2, baseline: 0, amplitude: 1 }
const DEFAULT_ENVELOPE: EnvelopeParams = {
  attackTicks: 10,
  decayTicks: 10,
  sustainTicks: 10,
  releaseTicks: 10,
  peak: 1,
  sustainLevel: 0.5,
  baseline: 0,
}

/**
 * Collects the per-curve params for "Apply Curve" (Pulsing / Envelope Sweep —
 * see `curvePresets.helpers.ts`) and, on confirm, computes the stamped
 * keyframes/tweens and hands them to `onApply` (the caller dispatches via
 * `useTimelineEditing().applyCurve`).
 */
export const ApplyCurveDialog = ({
  mode,
  initialStartTick,
  initialEndTick,
  onClose,
  onApply,
}: ApplyCurveDialogProps): JSX.Element => {
  const [startTick, setStartTick] = useState(initialStartTick)
  const [endTick, setEndTick] = useState(initialEndTick)
  const [pulse, setPulse] = useState<PulseParams>(DEFAULT_PULSE)
  const [envelope, setEnvelope] = useState<EnvelopeParams>(DEFAULT_ENVELOPE)

  // Re-seed every time the dialog opens fresh for a new target.
  useEffect(() => {
    if (mode === null) return
    setStartTick(initialStartTick)
    setEndTick(initialEndTick)
    setPulse(DEFAULT_PULSE)
    setEnvelope(DEFAULT_ENVELOPE)
  }, [mode, initialStartTick, initialEndTick])

  const handleApply = () => {
    const result =
      mode === 'pulse'
        ? stampPulse(startTick, endTick, pulse.cycles, pulse.baseline, pulse.amplitude)
        : mode === 'envelope'
          ? stampEnvelope(
              startTick,
              envelope.attackTicks,
              envelope.decayTicks,
              envelope.sustainTicks,
              envelope.releaseTicks,
              envelope.peak,
              envelope.sustainLevel,
              envelope.baseline
            )
          : undefined
    if (result) onApply(result)
    onClose()
  }

  return (
    <Dialog
      open={mode !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={mode === 'pulse' ? 'Apply Pulsing Curve' : 'Apply Envelope Sweep'}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" onClick={handleApply}>
            Apply
          </Button>
        </>
      }
    >
      <DialogFields>
        <EditableField
          type="number"
          label="Start"
          value={startTick}
          step={1}
          onValueChange={(v) => v !== null && setStartTick(v)}
        />
        {mode === 'pulse' && (
          <EditableField
            type="number"
            label="End"
            value={endTick}
            step={1}
            onValueChange={(v) => v !== null && setEndTick(v)}
          />
        )}
        {mode === 'pulse' && (
          <>
            <EditableField
              type="number"
              label="Cycles"
              value={pulse.cycles}
              min={1}
              step={1}
              onValueChange={(v) =>
                v !== null && ((v: number) => setPulse((p) => ({ ...p, cycles: v })))(v)
              }
            />
            <EditableField
              type="number"
              label="Baseline"
              value={pulse.baseline}
              step={0.01}
              onValueChange={(v) =>
                v !== null && ((v: number) => setPulse((p) => ({ ...p, baseline: v })))(v)
              }
            />
            <EditableField
              type="number"
              label="Amplitude"
              value={pulse.amplitude}
              step={0.01}
              onValueChange={(v) =>
                v !== null &&
                ((v: number) => setPulse((p) => ({ ...p, amplitude: v })))(v)
              }
            />
          </>
        )}
        {mode === 'envelope' && (
          <>
            <EditableField
              type="number"
              label="Attack (ticks)"
              value={envelope.attackTicks}
              min={1}
              step={1}
              onValueChange={(v) =>
                v !== null &&
                ((v: number) => setEnvelope((e) => ({ ...e, attackTicks: v })))(v)
              }
            />
            <EditableField
              type="number"
              label="Decay (ticks)"
              value={envelope.decayTicks}
              min={1}
              step={1}
              onValueChange={(v) =>
                v !== null &&
                ((v: number) => setEnvelope((e) => ({ ...e, decayTicks: v })))(v)
              }
            />
            <EditableField
              type="number"
              label="Sustain (ticks)"
              value={envelope.sustainTicks}
              min={1}
              step={1}
              onValueChange={(v) =>
                v !== null &&
                ((v: number) => setEnvelope((e) => ({ ...e, sustainTicks: v })))(v)
              }
            />
            <EditableField
              type="number"
              label="Release (ticks)"
              value={envelope.releaseTicks}
              min={1}
              step={1}
              onValueChange={(v) =>
                v !== null &&
                ((v: number) => setEnvelope((e) => ({ ...e, releaseTicks: v })))(v)
              }
            />
            <EditableField
              type="number"
              label="Peak"
              value={envelope.peak}
              step={0.01}
              onValueChange={(v) =>
                v !== null && ((v: number) => setEnvelope((e) => ({ ...e, peak: v })))(v)
              }
            />
            <EditableField
              type="number"
              label="Sustain Level"
              value={envelope.sustainLevel}
              step={0.01}
              onValueChange={(v) =>
                v !== null &&
                ((v: number) => setEnvelope((e) => ({ ...e, sustainLevel: v })))(v)
              }
            />
            <EditableField
              type="number"
              label="Baseline"
              value={envelope.baseline}
              step={0.01}
              onValueChange={(v) =>
                v !== null &&
                ((v: number) => setEnvelope((e) => ({ ...e, baseline: v })))(v)
              }
            />
          </>
        )}
      </DialogFields>
    </Dialog>
  )
}
