'use client'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { useAnchoredPopover, type Placement } from '../../utils/anchor.ts'
import { cx } from '../../utils/cx.ts'
import { ChevronGlyph } from '../../utils/glyphs.tsx'
import { Field } from '../Field/Field.tsx'
import { Input, type InputProps } from '../Input/Input.tsx'
import { composeRefs } from '../Slot/Slot.tsx'

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxProps extends Omit<
  InputProps,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'endAdornment'
> {
  label: ReactNode
  description?: ReactNode
  error?: ReactNode
  hideLabel?: boolean
  /** Options: objects, or plain strings used as both value and label. */
  options: ReadonlyArray<ComboboxOption | string>
  /** Selected option value (or custom text with `allowCustomValue`). */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  /** Called as the user types: load options asynchronously from here. */
  onInputChange?: (text: string) => void
  /** Which options match the typed text. Default: label contains it, ignoring case and accents. */
  filter?: (option: ComboboxOption, text: string) => boolean
  /** Accept typed text that matches no option as the value. */
  allowCustomValue?: boolean
  /** Shown when nothing matches. @default 'No results' */
  emptyMessage?: ReactNode
  /** Announced with the result count, e.g. `(n) => \`${n} results\``. */
  resultsLabel?: (count: number) => string
  /** @default 'Show options' */
  toggleLabel?: string
  /** @default 'bottom-start' */
  placement?: Placement
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()

export const defaultComboboxFilter = (option: ComboboxOption, text: string): boolean =>
  normalize(option.label).includes(normalize(text.trim()))

/**
 * A text input with a filtered list of suggestions: the WAI-ARIA combobox
 * pattern. Type to filter; arrows move through options; Enter or Tab picks;
 * Escape closes (or clears when closed). Focus stays in the input
 * throughout, and with `name` a hidden input submits the selected *value*.
 *
 * ```tsx
 * <Combobox label="Country" name="country" options={countries} placeholder="Search…" />
 * ```
 */
export const Combobox = ({
  label,
  description,
  error,
  hideLabel,
  options: rawOptions,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  onInputChange,
  filter = defaultComboboxFilter,
  allowCustomValue,
  emptyMessage = 'No results',
  resultsLabel = (n) => (n === 1 ? '1 result' : `${n} results`),
  toggleLabel = 'Show options',
  placement = 'bottom-start',
  name,
  required,
  disabled,
  invalid,
  className,
  style,
  ref,
  onKeyDown,
  onBlur,
  ...inputProps
}: ComboboxProps): JSX.Element => {
  const listId = useId()
  const options = useMemo(
    () => rawOptions.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
    [rawOptions]
  )
  const labelOf = (v: string | null) =>
    v === null
      ? ''
      : (options.find((o) => o.value === v)?.label ?? (allowCustomValue ? v : ''))

  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  })
  const [text, setText] = useState(() => labelOf(value))
  const [open, setOpen] = useState(false)
  const [filtering, setFiltering] = useState(false)
  const [active, setActive] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const anchor = useAnchoredPopover(placement, 4)

  const visible = filtering ? options.filter((o) => filter(o, text)) : options
  const optionId = (option: ComboboxOption) =>
    `${listId}-option-${options.indexOf(option)}`
  const enabledIndexes = visible.flatMap((o, i) => (o.disabled ? [] : [i]))

  // Outside value changes update the text, unless the user is typing.
  useEffect(() => {
    if (document.activeElement !== input.current) setText(labelOf(value))
  }, [value, options])

  // The popup is a manual popover: shown and sized to the field while open.
  useLayoutEffect(() => {
    const el = popup.current
    if (!el) return
    const shown = el.matches(':popover-open')
    if (open && !shown) {
      const frame = input.current?.parentElement
      if (frame) el.style.minInlineSize = `${frame.getBoundingClientRect().width}px`
      el.showPopover()
    }
    if (!open && shown) el.hidePopover()
  }, [open])

  useEffect(() => {
    if (!open || active < 0) return
    document
      .getElementById(optionId(visible[active]!))
      ?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const openWith = (index: number, filter: boolean) => {
    setFiltering(filter)
    setOpen(true)
    setActive(index)
  }

  const select = (option: ComboboxOption) => {
    if (option.disabled) return
    setValue(option.value)
    setText(option.label)
    setFiltering(false)
    setOpen(false)
  }

  const move = (direction: 1 | -1) => {
    if (!enabledIndexes.length) return
    const at = enabledIndexes.indexOf(active)
    const next =
      at === -1
        ? direction === 1
          ? enabledIndexes[0]!
          : enabledIndexes.at(-1)!
        : enabledIndexes[
            (at + direction + enabledIndexes.length) % enabledIndexes.length
          ]!
    setActive(next)
  }

  const selectedIndex = options.findIndex((o) => o.value === value)

  return (
    <Field
      label={label}
      description={description}
      error={error}
      hideLabel={hideLabel}
      required={required}
      disabled={disabled}
      invalid={invalid}
      className={cx('sauce-Combobox', className)}
    >
      <Input
        {...inputProps}
        ref={composeRefs<HTMLInputElement>(input, ref, (el) =>
          anchor.triggerRef(el?.parentElement ?? null)
        )}
        style={{ ...anchor.anchorStyle, ...style }}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && active >= 0 && visible[active] ? optionId(visible[active]) : undefined
        }
        value={text}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const next = event.target.value
          setText(next)
          onInputChange?.(next)
          const matches = options.filter((o) => filter(o, next))
          openWith(
            matches.findIndex((o) => !o.disabled),
            true
          )
        }}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          switch (event.key) {
            case 'ArrowDown':
              event.preventDefault()
              if (!open)
                openWith(
                  event.altKey ? -1 : Math.max(selectedIndex, enabledIndexes[0] ?? -1),
                  false
                )
              else move(1)
              break
            case 'ArrowUp':
              event.preventDefault()
              if (!open) openWith(enabledIndexes.at(-1) ?? -1, false)
              else move(-1)
              break
            case 'Enter':
              if (open && active >= 0 && visible[active]) {
                event.preventDefault()
                select(visible[active])
              }
              break
            case 'Tab':
              if (open && active >= 0 && visible[active]) select(visible[active])
              break
            case 'Escape':
              if (open) {
                event.preventDefault()
                setOpen(false)
              } else if (text) {
                event.preventDefault()
                setText('')
                setValue(null)
              }
              break
          }
        }}
        onBlur={(event: FocusEvent<HTMLInputElement>) => {
          onBlur?.(event)
          setOpen(false)
          setFiltering(false)
          const exact = options.find(
            (o) => !o.disabled && normalize(o.label) === normalize(text.trim())
          )
          if (text.trim() === '') setValue(null)
          else if (exact) select(exact)
          else if (allowCustomValue) setValue(text.trim())
          else setText(labelOf(value))
        }}
        endAdornment={
          <button
            type="button"
            tabIndex={-1}
            aria-label={toggleLabel}
            disabled={disabled}
            className="sauce-Combobox-toggle"
            data-open={open || undefined}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (open) setOpen(false)
              else openWith(Math.max(selectedIndex, enabledIndexes[0] ?? -1), false)
              input.current?.focus()
            }}
          >
            <ChevronGlyph />
          </button>
        }
      />
      {name && <input type="hidden" name={name} value={value ?? ''} />}
      <div
        ref={composeRefs<HTMLDivElement>(popup, anchor.floatingRef)}
        popover="manual"
        className="sauce-Combobox-popup"
        style={anchor.floatingStyle}
      >
        <ul
          id={listId}
          role="listbox"
          aria-label={typeof label === 'string' ? label : undefined}
          className="sauce-Combobox-list"
        >
          {visible.map((option, index) => (
            <li
              key={option.value}
              id={optionId(option)}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              data-active={index === active || undefined}
              className="sauce-Combobox-option"
              onMouseDown={(event) => event.preventDefault()}
              onPointerMove={() => !option.disabled && setActive(index)}
              onClick={() => select(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
        {visible.length === 0 && <p className="sauce-Combobox-empty">{emptyMessage}</p>}
      </div>
      <span className="sauce-VisuallyHidden" aria-live="polite">
        {open && filtering ? resultsLabel(visible.length) : ''}
      </span>
    </Field>
  )
}
