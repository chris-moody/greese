import { lazy, Suspense, useId, useState, type JSX, type ReactNode } from 'react'
import { Drawer, ScrollSpy, Stack } from '@greese/react'
import { ChevronDownIcon } from '@greese/icons'
import { RouteLink, useCurrentRoute, type Route } from '../../router.tsx'
import { TEMPLATES } from '../../templates/index.ts'
import { SECTIONS, SPY_OFFSET, STUDIO_TABS } from './links.ts'

// The docs' sections come with the docs' index: loaded when the menu opens.
const DocsMenuLinks = lazy(() =>
  import('../../docs/MenuLinks.tsx').then((m) => ({ default: m.DocsMenuLinks }))
)

/**
 * One page in the menu: its name is the link to it, and the rest of its row
 * (the chevron included) opens what's on it. Two controls side by side, not
 * a link inside a disclosure's summary, which would be a control inside a
 * control.
 */
const MenuSection = ({
  title,
  to,
  current,
  defaultOpen,
  onFollow,
  children,
}: {
  title: string
  to: Route
  current: boolean
  defaultOpen: boolean
  onFollow: () => void
  children: ReactNode
}): JSX.Element => {
  const [open, setOpen] = useState(defaultOpen)
  const list = useId()
  return (
    <div className="site-menu-section" data-open={open || undefined}>
      <div className="site-menu-head">
        <RouteLink
          to={to}
          hash={to === 'home' ? '#top' : ''}
          aria-current={current ? 'page' : undefined}
          className="site-menu-page"
          onClick={onFollow}
        >
          {title}
        </RouteLink>
        <button
          type="button"
          className="site-menu-toggle"
          aria-expanded={open}
          aria-controls={list}
          aria-label={`${title}: what's on it`}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDownIcon className="site-menu-chevron" />
        </button>
      </div>
      <div id={list} hidden={!open}>
        {children}
      </div>
    </div>
  )
}

/**
 * The phones' menu: the whole screen, each page a row over what's on it, the
 * page on screen open. A page's name goes to it; the rest of its row opens
 * its list. Following a link closes the menu.
 */
export const PhoneMenu = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}): JSX.Element => {
  const route = useCurrentRoute()
  const close = () => onOpenChange(false)
  const section = (to: Route, title: string, children: ReactNode) => (
    <MenuSection
      key={to}
      title={title}
      to={to}
      current={route === to}
      defaultOpen={route === to}
      onFollow={close}
    >
      {children}
    </MenuSection>
  )
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Menu"
      hideTitle
      placement="end"
      className="site-menu"
    >
      <Stack gap={1} className="site-menu-nav">
        {section(
          'home',
          'Home',
          <ScrollSpy key={route} asChild offset={SPY_OFFSET}>
            <Stack asChild gap={0} className="site-menu-links">
              <nav aria-label="Sections">
                {SECTIONS.map(([id, label]) => (
                  <RouteLink key={id} to="home" hash={`#${id}`} onClick={close}>
                    {label}
                  </RouteLink>
                ))}
              </nav>
            </Stack>
          </ScrollSpy>
        )}
        {section(
          'docs',
          'Docs',
          <Stack asChild gap={0} className="site-menu-links">
            <nav aria-label="Docs">
              {open && (
                <Suspense>
                  <DocsMenuLinks onFollow={close} />
                </Suspense>
              )}
            </nav>
          </Stack>
        )}
        {section(
          'studio',
          'Studio',
          <Stack asChild gap={0} className="site-menu-links">
            <nav aria-label="Studio">
              {STUDIO_TABS.map(([tab, label]) => (
                <RouteLink key={tab} to="studio" search={`?tab=${tab}`} onClick={close}>
                  {label}
                </RouteLink>
              ))}
            </nav>
          </Stack>
        )}
        {section(
          'templates',
          'Templates',
          <Stack asChild gap={0} className="site-menu-links">
            <nav aria-label="Templates">
              {TEMPLATES.map((t) => (
                <RouteLink key={t.id} to="templates" page={t.id} onClick={close}>
                  {t.title}
                </RouteLink>
              ))}
            </nav>
          </Stack>
        )}
      </Stack>
    </Drawer>
  )
}
