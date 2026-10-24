'use client'
import {
  createContext,
  use,
  useEffect,
  useId,
  useRef,
  type ComponentPropsWithRef,
  type JSX,
  type MouseEvent,
  type ReactNode,
} from 'react'
import type { Breakpoint } from '@greese/ui'
import { getBreakpoints } from '../../utils/breakpoints.ts'
import { cx } from '../../utils/cx.ts'
import { MenuIcon } from '@greese/icons'
import { IconButton, type IconButtonProps } from '../IconButton/IconButton.tsx'
import { composeRefs } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

/** Breakpoints at which the sidebar can become persistent. */
export type SidebarBreakpoint = Exclude<Breakpoint, 'xs'>

interface SidebarContextValue {
  id: string
  breakpoint: SidebarBreakpoint
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export interface SidebarLayoutProps extends GreeseProps, ComponentPropsWithRef<'div'> {
  /** From this breakpoint the sidebar is always visible; below it, off-canvas. @default 'md' */
  breakpoint?: SidebarBreakpoint
}

/**
 * App shell: a sidebar beside the content from `breakpoint` up; below it the
 * sidebar is off-canvas, opened by a SidebarTrigger. Put Sidebar first, then
 * the content (which can include an AppBar holding the trigger).
 */
export const SidebarLayout = ({
  greese,
  breakpoint = 'md',
  className,
  ...props
}: SidebarLayoutProps): JSX.Element => {
  const id = `${useId()}-sidebar`
  return withGreese(
    <SidebarContext value={{ id, breakpoint }}>
      <div
        {...props}
        className={cx(
          'greese-SidebarLayout',
          `greese-SidebarLayout--${breakpoint}`,
          className
        )}
      />
    </SidebarContext>,
    greese
  )
}

export interface SidebarProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'aside'>, 'popover'> {
  /** Names the landmark, e.g. "Main navigation". */
  label: string
  /** Narrow rail mode on wide screens (content decides what to show). */
  collapsed?: boolean
  /** The navigation: links, a Stack of Buttons, anything. */
  children: ReactNode
}

/**
 * The sidebar. Off-canvas below the layout's breakpoint (a native popover:
 * click-outside and Escape close it, and following a link inside does too);
 * a sticky column from the breakpoint up.
 */
export const Sidebar = ({
  greese,
  label,
  collapsed,
  className,
  ref,
  onClick,
  ...props
}: SidebarProps): JSX.Element => {
  const context = use(SidebarContext)
  const sidebar = useRef<HTMLElement>(null)
  const breakpoint = context?.breakpoint ?? 'md'

  // Opened on a phone, then widened past the breakpoint: close the overlay.
  useEffect(() => {
    const query = matchMedia(`(min-width: ${getBreakpoints()[breakpoint]}px)`)
    const onChange = () => {
      if (query.matches && sidebar.current?.matches(':popover-open'))
        sidebar.current.hidePopover()
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [breakpoint])

  return withGreese(
    <aside
      {...props}
      id={context?.id ?? props.id}
      ref={composeRefs(sidebar, ref)}
      popover="auto"
      aria-label={label}
      data-collapsed={collapsed || undefined}
      className={cx('greese-Sidebar', className)}
      onClick={(event: MouseEvent<HTMLElement>) => {
        onClick?.(event)
        const el = event.currentTarget
        if ((event.target as Element).closest('a[href]') && el.matches(':popover-open')) {
          el.hidePopover()
        }
      }}
    />,
    greese
  )
}

export interface SidebarTriggerProps
  extends GreeseProps, Omit<IconButtonProps, 'label' | 'children'> {
  /** Accessible name of the button. @default 'Open navigation' */
  label?: string
  /** Your menu icon. A built-in one is used if omitted. */
  children?: ReactNode
}

/** Opens the off-canvas sidebar; hidden once the sidebar is persistent. */
export const SidebarTrigger = ({
  greese,
  label = 'Open navigation',
  className,
  children,
  ...props
}: SidebarTriggerProps): JSX.Element => {
  const context = use(SidebarContext)
  return withGreese(
    <IconButton
      {...props}
      label={label}
      popoverTarget={context?.id}
      className={cx(
        'greese-SidebarTrigger',
        `greese-SidebarTrigger--${context?.breakpoint ?? 'md'}`,
        className
      )}
    >
      {children ?? <MenuIcon />}
    </IconButton>,
    greese
  )
}
