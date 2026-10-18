'use client'
import {
  createContext,
  use,
  useId,
  useMemo,
  type ComponentPropsWithRef,
  type JSX,
  type KeyboardEvent,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

interface TabsContextValue {
  baseId: string
  value: string | undefined
  select: (value: string) => void
  orientation: 'horizontal' | 'vertical'
  activation: 'automatic' | 'manual'
}

const TabsContext = createContext<TabsContextValue | null>(null)

const useTabs = (component: string): TabsContextValue => {
  const context = use(TabsContext)
  if (!context) throw new Error(`<${component}> must be used inside <Tabs>.`)
  return context
}

/** Values become id fragments: keep them id-safe. */
const idFor = (base: string, kind: 'tab' | 'panel', value: string) =>
  `${base}-${kind}-${value.replace(/[^\w-]/g, '_')}`

export interface TabsProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'dir'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical'
  /**
   * `automatic` selects a tab as soon as it is focused with the arrow keys;
   * `manual` waits for Enter or Space (better when panels are slow to render).
   * @default 'automatic'
   */
  activation?: 'automatic' | 'manual'
}

/**
 * Tabs, per the WAI-ARIA pattern: one tab stop for the whole list, arrow keys
 * to move (mirrored in right-to-left), Home/End to jump. Every panel stays in
 * the server-rendered HTML; inactive ones are `hidden`.
 *
 * ```tsx
 * <Tabs defaultValue="overview">
 *   <TabList aria-label="Project">
 *     <Tab value="overview">Overview</Tab>
 *     <Tab value="activity">Activity</Tab>
 *   </TabList>
 *   <TabPanel value="overview">…</TabPanel>
 *   <TabPanel value="activity">…</TabPanel>
 * </Tabs>
 * ```
 */
export const Tabs = ({
  greese,
  value: valueProp,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  activation = 'automatic',
  className,
  ...props
}: TabsProps): JSX.Element => {
  const baseId = useId()
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange as ((v: string | undefined) => void) | undefined,
  })
  const context = useMemo(
    () => ({ baseId, value, select: setValue, orientation, activation }),
    [baseId, value, setValue, orientation, activation]
  )
  return withGreese(
    <TabsContext value={context}>
      <div
        {...props}
        data-orientation={orientation}
        className={cx('greese-Tabs', className)}
      />
    </TabsContext>,
    greese
  )
}

/** The row (or column) of tabs. Give it an `aria-label`. */
export const TabList = ({
  greese,
  className,
  onKeyDown,
  ...props
}: ComponentPropsWithRef<'div'> & GreeseProps): JSX.Element => {
  const { orientation, activation, select } = useTabs('TabList')

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)'
      )
    )
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement)
    if (current === -1) return

    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const [prev, next] =
      orientation === 'vertical'
        ? ['ArrowUp', 'ArrowDown']
        : rtl
          ? ['ArrowRight', 'ArrowLeft']
          : ['ArrowLeft', 'ArrowRight']

    let target: number
    if (event.key === next) target = (current + 1) % tabs.length
    else if (event.key === prev) target = (current - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') target = 0
    else if (event.key === 'End') target = tabs.length - 1
    else return

    event.preventDefault()
    const tab = tabs[target]!
    tab.focus()
    if (activation === 'automatic' && tab.dataset.value) select(tab.dataset.value)
  }

  return withGreese(
    <div
      role="tablist"
      aria-orientation={orientation}
      {...props}
      onKeyDown={move}
      className={cx('greese-TabList', className)}
    />,
    greese
  )
}

export interface TabProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'button'>, 'value'> {
  value: string
}

/** One tab. Only the selected tab is in the Tab order. */
export const Tab = ({
  greese,
  value,
  className,
  onClick,
  ...props
}: TabProps): JSX.Element => {
  const { baseId, value: selected, select } = useTabs('Tab')
  const isSelected = selected === value
  return withGreese(
    <button
      type="button"
      role="tab"
      {...props}
      id={idFor(baseId, 'tab', value)}
      aria-selected={isSelected}
      aria-controls={idFor(baseId, 'panel', value)}
      tabIndex={isSelected ? 0 : -1}
      data-value={value}
      className={cx('greese-Tab', className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) select(value)
      }}
    />,
    greese
  )
}

export interface TabPanelProps extends GreeseProps, ComponentPropsWithRef<'div'> {
  value: string
}

/**
 * The content for one tab. Focusable, so keyboard users can reach content
 * with no focusable elements of its own.
 */
export const TabPanel = ({
  greese,
  value,
  className,
  ...props
}: TabPanelProps): JSX.Element => {
  const { baseId, value: selected } = useTabs('TabPanel')
  return withGreese(
    <div
      role="tabpanel"
      tabIndex={0}
      {...props}
      id={idFor(baseId, 'panel', value)}
      aria-labelledby={idFor(baseId, 'tab', value)}
      hidden={selected !== value}
      className={cx('greese-TabPanel', className)}
    />,
    greese
  )
}
