/**
 * BoundField — one edge of a tween's x/y bounds (Keep Before/Behind/Below/
 * Above). Wraps `EditableSelect<string>` (see its `parse`/`format` props):
 * typing a number sets a literal pixel bound, typing (or picking from the
 * dropdown) an existing guide's name sets a guide-referenced bound that
 * tracks that guide if it's later moved. A clear button unsets the edge
 * entirely (`EditableSelect`'s `onChange` has no "clear" value to pass, so
 * this sits outside it as a separate control).
 */
import { CloseIcon as ClearIcon } from '@greese/icons'
import type { JSX } from 'react'
import { IconButton } from '@greese/react'
import { EditableSelect } from '../../components/EditableSelect/EditableSelect.tsx'
import type { AuthoringGuide } from '../../state/guides.slice.ts'
import type { TweenBoundRef } from '../../core/types/tween.types.ts'
import { FieldLabel } from '../panelParts.tsx'

const GUIDE_PREFIX = 'guide:'

const encode = (ref: TweenBoundRef | undefined): string => {
  if (!ref) return ''
  if (ref.kind === 'guide') return `${GUIDE_PREFIX}${ref.guideId ?? ''}`
  return ref.value !== undefined ? String(ref.value) : ''
}

export interface BoundFieldProps {
  label: string
  value: TweenBoundRef | undefined
  /** Guides applicable to this bound's axis (vertical guides for an x bound, horizontal for a y bound) — see `TweenPanel`'s caller. */
  guides: AuthoringGuide[]
  onChange: (ref: TweenBoundRef | null) => void
}

export const BoundField = ({
  label,
  value,
  guides,
  onChange,
}: BoundFieldProps): JSX.Element => {
  const options = guides.map((g) => ({
    value: `${GUIDE_PREFIX}${g.id}`,
    label: g.name ?? g.id,
  }))

  const format = (sentinel: string): string => {
    if (sentinel.startsWith(GUIDE_PREFIX)) {
      const id = sentinel.slice(GUIDE_PREFIX.length)
      return guides.find((g) => g.id === id)?.name ?? id
    }
    return sentinel
  }

  const parse = (text: string): string | undefined => {
    const trimmed = text.trim()
    if (trimmed === '') return undefined
    const matchedGuide = guides.find((g) => g.name === trimmed)
    if (matchedGuide) return `${GUIDE_PREFIX}${matchedGuide.id}`
    const num = Number(trimmed)
    return isNaN(num) ? undefined : String(num)
  }

  const handleChange = (sentinel: string) => {
    if (sentinel.startsWith(GUIDE_PREFIX)) {
      onChange({ kind: 'guide', guideId: sentinel.slice(GUIDE_PREFIX.length) })
      return
    }
    const num = Number(sentinel)
    if (!isNaN(num)) onChange({ kind: 'value', value: num })
  }

  return (
    <div className={'greese-BoundField-row'}>
      <FieldLabel>{label}</FieldLabel>
      <div className={'greese-BoundField-controls'}>
        <EditableSelect<string>
          label={label}
          value={encode(value)}
          options={options}
          format={format}
          parse={parse}
          onChange={handleChange}
        />
        <IconButton
          size="sm"
          variant="ghost"
          label={`Clear ${label}`}
          onClick={() => onChange(null)}
          disabled={!value}
        >
          <ClearIcon />
        </IconButton>
      </div>
    </div>
  )
}
