import { useDeferredValue, useState, type JSX } from 'react'
import { SearchIcon } from '@greese/icons'
import { Text, TextField } from '@greese/react'

/**
 * A text box that narrows a list by name, as you type: `useNameFilter` keeps
 * the query and matches names against it, case aside.
 */
export const useNameFilter = (): {
  query: string
  setQuery: (query: string) => void
  matches: (name: string) => boolean
} => {
  const [query, setQuery] = useState('')
  // Typing stays quick in a long list: the list catches up.
  const deferred = useDeferredValue(query).trim().toLowerCase()
  return {
    query,
    setQuery,
    matches: (name) => !deferred || name.toLowerCase().includes(deferred),
  }
}

export const NameFilter = ({
  label,
  query,
  onQueryChange,
  shown,
  total,
}: {
  label: string
  query: string
  onQueryChange: (query: string) => void
  shown: number
  total: number
}): JSX.Element => (
  <div className="docs-filter">
    <TextField
      type="search"
      label={label}
      value={query}
      onChange={(event) => onQueryChange(event.currentTarget.value)}
      startAdornment={<SearchIcon />}
      autoComplete="off"
      spellCheck={false}
    />
    <Text
      variant="p3"
      tone="muted"
      role="status"
      style={{ marginBlockStart: 'var(--greese-space-1)' }}
    >
      {shown === total ? `${total} in all` : `${shown} of ${total}`}
    </Text>
  </div>
)
