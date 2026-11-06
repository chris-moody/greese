import { useSearchParams } from 'react-router'

export const TABS = ['tokens', 'components', 'shapes', 'motion', 'output'] as const
export type StudioTab = (typeof TABS)[number]

/**
 * The editor's open tab, kept in the URL so a link can open it
 * (`/studio?tab=motion`; tokens when there's none, or it's unknown). A link
 * to another tab (the menu, search) or the history moving opens it, since
 * the tab is read from the router's location.
 */
export const useStudioTab = (): [StudioTab, (tab: StudioTab) => void] => {
  const [params, setParams] = useSearchParams()
  // `code` was the Output tab's name; old links still open it.
  const asked = params.get('tab') === 'code' ? 'output' : params.get('tab')
  const tab = TABS.find((t) => t === asked) ?? 'tokens'
  const setTab = (next: StudioTab) =>
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)
        if (next === 'tokens') updated.delete('tab')
        else updated.set('tab', next)
        return updated
      },
      // Replaced, not pushed: switching tabs shouldn't fill the back button's
      // history, nor scroll the page (ScrollOnRoute scrolls on a push).
      { replace: true }
    )
  return [tab, setTab]
}
