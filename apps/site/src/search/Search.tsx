import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
  type JSX,
} from 'react'
import { Icon, IconButton, Key } from '@greese/react'
import { icons } from '../icons.tsx'
import { whenIdle } from '../idle.ts'

// The dialog and its index (every docs page) are a chunk of their own,
// fetched when the pointer or focus comes to a search control, or on open.
const loadDialog = () => import('./SearchDialog.tsx')
const SearchDialog = lazy(() => loadDialog().then((m) => ({ default: m.SearchDialog })))
const preload = () => void loadDialog()

const isMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent)
const never = () => () => {}
/**
 * Whether to show ⌘ rather than Ctrl. The prerendered homepage can't know,
 * so it says Ctrl, and hydrating keeps it until the page is the browser's;
 * then a Mac's says ⌘.
 */
const useMac = (): boolean => useSyncExternalStore(never, isMac, () => false)

/** What the search controls open: the shortcut's handler and the dialog's state. */
export const useSearch = (): {
  open: boolean
  setOpen: (open: boolean) => void
  dialog: JSX.Element | null
} => {
  const [open, setOpen] = useState(false)
  // Mounted on first open and kept, so the query survives closing.
  const [mounted, setMounted] = useState(false)
  // Fetched once the page is idle too, so keys typed straight after ⌘K land
  // in the field rather than before it exists.
  useEffect(() => whenIdle(preload, 6000), [])
  useEffect(() => {
    if (open) setMounted(true)
  }, [open])
  // ⌘K or Ctrl+K anywhere (either, whatever the platform shows); `/` too,
  // unless it's being typed into a field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const typing =
        target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      const combo = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)
      if (combo || (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey)) {
        event.preventDefault()
        setOpen(true)
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])
  const dialog =
    open || mounted ? (
      <Suspense>
        <SearchDialog open={open} onOpenChange={setOpen} />
      </Suspense>
    ) : null
  return { open, setOpen, dialog }
}

interface SearchTriggerProps {
  open: boolean
  onOpen: () => void
}

const triggerProps = ({ open, onOpen }: SearchTriggerProps, mac: boolean) => ({
  type: 'button' as const,
  'aria-haspopup': 'dialog' as const,
  'aria-expanded': open,
  'aria-keyshortcuts': mac ? 'Meta+K' : 'Control+K',
  onClick: onOpen,
  onPointerEnter: preload,
  onFocus: preload,
})

/**
 * Search from md: a short box with a magnifying glass, "Search" where a
 * placeholder would be and the shortcut. A button (it opens the search
 * dialog), dressed as the field it leads to.
 */
export const SearchBox = (props: SearchTriggerProps): JSX.Element => {
  const mac = useMac()
  return (
    // Named Search; the shortcut is aria-keyshortcuts, so the key isn't read out.
    <button {...triggerProps(props, mac)} aria-label="Search" className="site-search-box">
      <Icon>{icons.search}</Icon>
      <span className="site-search-box-text">Search</span>
      <Key size="sm">{mac ? '⌘' : 'Ctrl'} K</Key>
    </button>
  )
}

/** Search below md: the magnifying glass alone, an icon button's size. */
export const SearchIconButton = (props: SearchTriggerProps): JSX.Element => (
  <IconButton {...triggerProps(props, useMac())} size="sm" variant="soft" label="Search">
    <Icon>{icons.search}</Icon>
  </IconButton>
)
