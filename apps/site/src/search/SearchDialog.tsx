import '../styles/library.ts'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { Button, Dialog, Icon, Input, Key, Text, useStoredState } from '@greese/react'
import { icons } from '../icons.tsx'
import { navigate } from '../router.tsx'
import { ENTRIES, grouped, highlight, search, type SearchEntry } from './entries.ts'

/** The last few entries opened, newest first, by href. */
const RECENT = 'site-search-recent'
const RECENT_MAX = 5

/** With nothing typed: the site itself, not the hundred-odd docs pages. */
const SUGGESTED = ENTRIES.filter((entry) => entry.group !== 'Docs')

const isHrefList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string')

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The site's search: a field over its results, grouped by where they are.
 * Focus stays in the field; the arrow keys move through the results (a
 * combobox over a listbox), Enter opens one, Escape closes. With nothing
 * typed it lists recent picks, then the site's pages and sections. Each result
 * is a real link, so a modified click opens it in a new tab.
 */
export const SearchDialog = ({ open, onOpenChange }: SearchDialogProps): JSX.Element => {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [recent, setRecent] = useStoredState<string[]>(RECENT, [], {
    validate: isHrefList,
  })

  const groups = useMemo(() => {
    if (query.trim()) return grouped(search(query))
    const recents = recent
      .map((href) => ENTRIES.find((entry) => entry.href === href))
      .filter((entry): entry is SearchEntry => !!entry)
    return [
      ...(recents.length ? [['Recent', recents] as [string, SearchEntry[]]] : []),
      ...grouped(SUGGESTED),
    ]
  }, [query, recent])
  // The results in the order they're shown, which is the order the arrows move in.
  const results = useMemo(() => groups.flatMap(([, entries]) => entries), [groups])
  const optionId = (index: number) => `${id}-option-${index}`
  const activeId = results[active] ? optionId(active) : undefined

  // A new list (typing, or clearing Recent) starts at its first result.
  useEffect(() => setActive(0), [results])
  // Opened again, the last query is still there, selected, to type over.
  useEffect(() => {
    if (open) input.current?.select()
  }, [open])
  useEffect(() => {
    if (activeId)
      list.current
        ?.querySelector(`#${CSS.escape(activeId)}`)
        ?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  const go = (entry: SearchEntry) => {
    setRecent(
      [entry.href, ...recent.filter((href) => href !== entry.href)].slice(0, RECENT_MAX)
    )
    onOpenChange(false)
    navigate(entry.href)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const count = results.length
    if (!count) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + count) % count)
    } else if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      const entry = results[active]
      if (entry) go(entry)
    }
  }

  const onClick = (event: MouseEvent<HTMLAnchorElement>, entry: SearchEntry) => {
    // A modified click is the browser's: a new tab or window.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    event.preventDefault()
    go(entry)
  }

  let index = -1
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      hideTitle
      className="site-search"
      footer={
        <div className="site-search-keys" aria-hidden="true">
          <span>
            <Key size="sm">↵</Key> to open
          </span>
          <span>
            <Key size="sm">↑</Key>
            <Key size="sm">↓</Key> to move
          </span>
          <span>
            <Key size="sm">esc</Key> to close
          </span>
        </div>
      }
    >
      <Input
        ref={input}
        type="search"
        // A field in a dialog the user just opened to type in.
        autoFocus
        enterKeyHint="go"
        autoComplete="off"
        spellCheck={false}
        placeholder="Search the site and the docs"
        aria-label="Search"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        startAdornment={<Icon>{icons.search}</Icon>}
        className="site-search-field"
      />
      <div
        ref={list}
        id={`${id}-list`}
        role="listbox"
        aria-label="Results"
        className="site-search-results"
      >
        {groups.map(([group, entries], g) => (
          // By position: a group's name can have spaces, which an id can't.
          <div key={group} role="group" aria-labelledby={`${id}-group-${g}`}>
            <Text
              id={`${id}-group-${g}`}
              variant="p3"
              weight="bold"
              tone="muted"
              className="site-search-group"
            >
              {group}
            </Text>
            {entries.map((entry) => {
              const at = ++index
              return (
                <a
                  key={entry.href}
                  id={optionId(at)}
                  role="option"
                  aria-selected={at === active}
                  tabIndex={-1}
                  href={entry.href}
                  className="site-search-option"
                  onPointerMove={() => at !== active && setActive(at)}
                  onClick={(e) => onClick(e, entry)}
                >
                  <span className="site-search-option-title">
                    {highlight(entry.title, query).map((part, i) =>
                      i % 2 ? <mark key={i}>{part}</mark> : part
                    )}
                  </span>
                  {entry.hint && (
                    <span className="site-search-option-hint">{entry.hint}</span>
                  )}
                </a>
              )
            })}
          </div>
        ))}
      </div>
      {/* Outside the listbox, which holds only results. */}
      <Text tone="muted" role="status" className="site-search-empty">
        {results.length ? '' : `No results for “${query.trim()}”`}
      </Text>
      {!query.trim() && recent.length > 0 && (
        <Button size="sm" variant="ghost" tone="neutral" onClick={() => setRecent([])}>
          Clear recent
        </Button>
      )}
    </Dialog>
  )
}
