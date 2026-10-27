import type { JSX } from 'react'
import { Accordion, AccordionItem, Text } from '@greese/react'
import { ALL_BLOCKS, BlockTable } from './ComponentStyles.tsx'
import { NameFilter, useNameFilter } from './NameFilter.tsx'

/**
 * Every component's classes, from the style manifest: one accordion item per
 * component, narrowed by a filter on its name.
 */
export const ComponentReference = (): JSX.Element => {
  const { query, setQuery, matches } = useNameFilter()
  const shown = ALL_BLOCKS.filter((block) => matches(block.name))
  return (
    <div style={{ display: 'grid', gap: 'var(--greese-space-4)' }}>
      <NameFilter
        label="Filter components"
        query={query}
        onQueryChange={setQuery}
        shown={shown.length}
        total={ALL_BLOCKS.length}
      />
      {shown.length ? (
        <Accordion>
          {shown.map((block) => (
            <AccordionItem
              key={block.name}
              title={
                <>
                  {block.name}{' '}
                  <Text asChild variant="p3" tone="muted">
                    <span>css/{block.stylesheet}.css</span>
                  </Text>
                </>
              }
            >
              <BlockTable block={block} caption={false} />
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Text tone="muted">No component matches “{query}”.</Text>
      )}
    </div>
  )
}
