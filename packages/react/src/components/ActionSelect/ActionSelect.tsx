'use client'
import type { ChangeEvent, JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import type { ControlSize } from '../Button/Button.tsx'
import { ButtonGroup, type ButtonGroupProps } from '../ButtonGroup/ButtonGroup.tsx'
import { IconButton } from '../IconButton/IconButton.tsx'
import { Select, type SelectProps } from '../Select/Select.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface ActionSelectOption {
  /** Submitted with the form and passed to `onValueChange`. */
  value: string
  /** The text shown in the list. */
  label: string
  /** Options sharing a group are listed under it, in order of appearance. */
  group?: string
  /** Listed but can't be chosen. */
  disabled?: boolean
}

export interface ActionSelectProps
  extends
    GreeseProps,
    Omit<ButtonGroupProps, 'onChange' | 'defaultValue' | 'attached' | 'orientation'> {
  /** The choices. Or pass `<option>` / `<optgroup>` children instead. */
  options?: readonly ActionSelectOption[]
  /** `<option>` and `<optgroup>` elements, instead of `options`. */
  children?: ReactNode
  /** The chosen option's value, when you control it. Pair with `onValueChange`. */
  value?: string
  /** The option chosen at first, when the component keeps its own state. */
  defaultValue?: string
  /** Called with the new value when the user chooses an option. */
  onValueChange?: (value: string) => void
  /** The button's icon: any element, from any icon set. */
  icon: ReactNode
  /** The button's accessible name, e.g. "Create project". */
  actionLabel: string
  /** Runs when the button is pressed. */
  onAction: () => void
  /** The select's accessible name, e.g. "Project". */
  selectLabel: string
  /** Height and text size of the button and select together. @default 'md' */
  size?: ControlSize
  /** Disables both the button and the select. */
  disabled?: boolean
  /** Extra props for the Select (name, required, placeholder…). */
  selectProps?: Omit<
    SelectProps,
    'value' | 'defaultValue' | 'onChange' | 'size' | 'children'
  >
}

/** Options as `<option>`s, with a contiguous `group` run wrapped in one `<optgroup>`. */
const renderOptions = (options: readonly ActionSelectOption[]): ReactNode[] => {
  const out: ReactNode[] = []
  for (let i = 0; i < options.length;) {
    const group = options[i]!.group
    let end = i + 1
    while (end < options.length && options[end]!.group === group) end++
    const items = options.slice(i, end).map((o) => (
      <option key={o.value} value={o.value} disabled={o.disabled}>
        {o.label}
      </option>
    ))
    out.push(
      group === undefined ? (
        items
      ) : (
        <optgroup key={`group-${i}`} label={group}>
          {items}
        </optgroup>
      )
    )
    i = end
  }
  return out
}

/**
 * An icon button joined to a select: one control to act and one to choose,
 * such as "new project" beside a project switcher, or "export" beside a
 * format picker (run the picked option from `onValueChange` and the last one
 * from `onAction`).
 *
 * ```tsx
 * <ActionSelect
 *   icon={<PlusIcon />} actionLabel="New project" onAction={create}
 *   selectLabel="Project" options={projects} value={id} onValueChange={open}
 * />
 * ```
 *
 * The select is native: the platform picker on phones, typeahead everywhere.
 */
export const ActionSelect = ({
  greese,
  options,
  children,
  value,
  defaultValue,
  onValueChange,
  icon,
  actionLabel,
  onAction,
  selectLabel,
  size = 'md',
  disabled,
  selectProps,
  className,
  ...props
}: ActionSelectProps): JSX.Element =>
  withGreese(
    <ButtonGroup {...props} attached className={cx('greese-ActionSelect', className)}>
      <IconButton
        label={actionLabel}
        variant="outline"
        tone="neutral"
        size={size}
        disabled={disabled}
        onClick={onAction}
      >
        {icon}
      </IconButton>
      <Select
        aria-label={selectLabel}
        {...selectProps}
        size={size}
        disabled={disabled}
        value={value}
        defaultValue={defaultValue}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onValueChange?.(event.target.value)
        }
      >
        {options ? renderOptions(options) : children}
      </Select>
    </ButtonGroup>,
    greese
  )
