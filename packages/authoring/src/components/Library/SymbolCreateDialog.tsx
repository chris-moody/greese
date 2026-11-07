'use client'
import type { JSX, ReactNode } from 'react'
import { Button, Dialog, Field, Input, Select, Stack } from '@greese/react'

/** One kind of symbol the dialog offers. */
export interface SymbolTypeOption<T extends string = string> {
  /** What the dialog reports when it's chosen. */
  value: T
  /** Its name in the list. */
  label: string
}

export interface SymbolCreateDialogProps<T extends string = string> {
  /** Whether the dialog is open. */
  open: boolean
  /** The dialog's title. @default 'Add symbol' */
  title?: string
  /** The kinds of symbol to choose from. */
  types: SymbolTypeOption<T>[]
  /** The chosen kind, or '' for none yet. */
  symbolType: T | ''
  /** Called with the newly chosen kind. */
  onChangeSymbolType: (type: T) => void
  /** The new symbol's name. Leave it and `onChangeName` out for a kind with no name. */
  name?: string
  /** Called as the name is typed. */
  onChangeName?: (name: string) => void
  /** Called on Cancel, Escape or a click outside. */
  onClose: () => void
  /** Called on Create. */
  onConfirm: () => void
  /** Whether Create is allowed, beyond a kind being chosen: a host's own required field. @default true */
  canCreate?: boolean
  /** More fields, below the kind and name. */
  children?: ReactNode
}

/**
 * The "add a symbol" dialog: choose a kind, name it, Create. A host with more
 * to ask (a slot to fill) adds fields as children and gates `canCreate`.
 *
 * ```tsx
 * <SymbolCreateDialog open={open} types={kinds} symbolType={kind} onChangeSymbolType={setKind}
 *   name={name} onChangeName={setName} onClose={close} onConfirm={create} />
 * ```
 */
export const SymbolCreateDialog = <T extends string = string>({
  open,
  title = 'Add symbol',
  types,
  symbolType,
  onChangeSymbolType,
  name,
  onChangeName,
  onClose,
  onConfirm,
  canCreate = true,
  children,
}: SymbolCreateDialogProps<T>): JSX.Element => (
  <Dialog
    open={open}
    onOpenChange={(next) => {
      if (!next) onClose()
    }}
    size="sm"
    title={title}
    footer={
      <>
        <Button variant="text" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={!symbolType || !canCreate}>
          Create
        </Button>
      </>
    }
  >
    <Stack gap={3}>
      <Field label="Type">
        <Select
          value={symbolType}
          onChange={(event) => onChangeSymbolType(event.target.value as T)}
        >
          {types.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </Field>
      {name !== undefined && onChangeName && (
        <Field label="Name">
          <Input value={name} onChange={(event) => onChangeName(event.target.value)} />
        </Field>
      )}
      {children}
    </Stack>
  </Dialog>
)
