import type { JSX } from 'react'
import { Accordion, AccordionItem, Drawer, ScrollSpy, Stack } from '@greese/react'
import { RouteLink, useCurrentRoute } from '../../router.tsx'
import { TEMPLATES } from '../../templates/index.ts'
import { SECTIONS, SPY_OFFSET, STUDIO_TABS } from './links.ts'

/**
 * The phones' menu: the whole screen, each page a header over what's on it,
 * the page on screen open. Following a link closes it.
 */
export const PhoneMenu = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}): JSX.Element => {
  const route = useCurrentRoute()
  const home = route === 'home'
  const studio = route === 'studio'
  const studioCurrent = studio ? 'page' : undefined
  const templatesCurrent = route === 'templates' ? 'page' : undefined
  const close = () => onOpenChange(false)
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Menu"
      hideTitle
      placement="end"
      className="site-menu"
    >
      <Stack gap={5}>
        {/* Each page is a header over what's on it, its own link first. The
            header only opens and closes the list: a link inside it would be
            a control inside a control. */}
        <Accordion className="site-menu-nav">
          <AccordionItem defaultOpen={home} title="Home">
            <ScrollSpy key={route} asChild offset={SPY_OFFSET}>
              <Stack asChild gap={0} className="site-menu-links">
                <nav aria-label="Sections">
                  <RouteLink to="home" hash="#top" onClick={close}>
                    Home
                  </RouteLink>
                  {SECTIONS.map(([id, label]) => (
                    <RouteLink key={id} to="home" hash={`#${id}`} onClick={close}>
                      {label}
                    </RouteLink>
                  ))}
                </nav>
              </Stack>
            </ScrollSpy>
          </AccordionItem>
          <AccordionItem defaultOpen={studio} title="Studio">
            <Stack asChild gap={0} className="site-menu-links">
              <nav aria-label="Studio">
                <RouteLink to="studio" aria-current={studioCurrent} onClick={close}>
                  Theme Studio
                </RouteLink>
                {STUDIO_TABS.map(([tab, label]) => (
                  <RouteLink key={tab} to="studio" search={`?tab=${tab}`} onClick={close}>
                    {label}
                  </RouteLink>
                ))}
              </nav>
            </Stack>
          </AccordionItem>
          <AccordionItem defaultOpen={route === 'templates'} title="Templates">
            <Stack asChild gap={0} className="site-menu-links">
              <nav aria-label="Templates">
                <RouteLink to="templates" aria-current={templatesCurrent} onClick={close}>
                  All templates
                </RouteLink>
                {TEMPLATES.map((t) => (
                  <RouteLink key={t.id} to="templates" page={t.id} onClick={close}>
                    {t.title}
                  </RouteLink>
                ))}
              </nav>
            </Stack>
          </AccordionItem>
        </Accordion>
      </Stack>
    </Drawer>
  )
}
