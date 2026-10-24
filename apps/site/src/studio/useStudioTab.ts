import { useEffect, useState } from 'react'
import { useQuery } from '../router.tsx'

export const TABS = ['tokens', 'components', 'shapes', 'motion', 'code'] as const
export type StudioTab = (typeof TABS)[number]

/** The tab a link opens: `/studio?tab=motion`. Tokens when there's none, or it's unknown. */
const tabFromUrl = (): StudioTab => {
  const tab = new URLSearchParams(location.search).get('tab')
  return TABS.find((t) => t === tab) ?? 'tokens'
}

/** The editor's open tab, kept in the URL so a link can open it. */
export const useStudioTab = (): [StudioTab, (tab: StudioTab) => void] => {
  const [tab, setTab] = useState<StudioTab>(tabFromUrl)
  // Replaced, not pushed: switching tabs shouldn't fill the back button's history.
  useEffect(() => {
    const url = new URL(location.href)
    if (tab === 'tokens') url.searchParams.delete('tab')
    else url.searchParams.set('tab', tab)
    if (url.href !== location.href) history.replaceState(history.state, '', url)
  }, [tab])
  // A link to another tab (the menu, search) or the history moving opens it.
  const query = useQuery()
  useEffect(() => setTab(tabFromUrl()), [query])
  return [tab, setTab]
}
