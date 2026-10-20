import { useState, type JSX } from 'react'
import * as icons from '@greese/icons'
import { CheckIcon, PlusIcon } from '@greese/icons'
import { Button, Grid, IconButton, Stack, Text, Tile } from '@greese/react'

type Icon = (props: icons.IconProps) => JSX.Element

const PACKAGE = '@greese/icons'
const names = Object.keys(icons).filter((name) => /^[A-Z]\w*Icon$/.test(name))
const importOf = (list: string[]) => `import { ${list.join(', ')} } from '${PACKAGE}'`

/**
 * Every icon in @greese/icons. Each tile copies its import or its name;
 * "+" collects icons into a list, copied as names or as one import.
 */
export const IconGallery = (): JSX.Element => {
  const [selected, setSelected] = useState<string[]>([])
  const [status, setStatus] = useState('')

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus(`Copied ${what}`)
    } catch {
      setStatus(`Couldn't copy: your browser blocked the clipboard`)
    }
  }
  const toggle = (name: string) =>
    setSelected((list) =>
      list.includes(name) ? list.filter((n) => n !== name) : [...list, name].sort()
    )

  return (
    <Stack gap={4}>
      {selected.length > 0 && (
        <Tile variant="outline" className="icon-gallery-bar">
          <Stack direction="row" gap={2} align="center" wrap="wrap">
            <Text variant="p3" weight="semibold">
              {selected.length} selected
            </Text>
            <Text variant="p3" tone="muted" truncate style={{ flex: '1 1 12rem' }}>
              {selected.join(', ')}
            </Text>
            <Button
              size="sm"
              variant="soft"
              onClick={() => copy(selected.join(', '), 'the names')}
            >
              Copy names
            </Button>
            <Button size="sm" onClick={() => copy(importOf(selected), 'the import')}>
              Copy import
            </Button>
            <Button
              size="sm"
              variant="ghost"
              tone="neutral"
              onClick={() => setSelected([])}
            >
              Clear
            </Button>
          </Stack>
        </Tile>
      )}
      <p role="status" className="icon-gallery-status">
        {status}
      </p>
      <Grid container minChildWidth="10rem" gap={3}>
        {names.map((name) => {
          const Glyph = icons[name as keyof typeof icons] as Icon
          const chosen = selected.includes(name)
          return (
            <Tile
              key={name}
              variant="outline"
              className="icon-gallery-tile"
              data-selected={chosen || undefined}
            >
              <IconButton
                label={`${chosen ? 'Remove' : 'Add'} ${name} ${chosen ? 'from' : 'to'} the import list`}
                aria-pressed={chosen}
                size="sm"
                variant={chosen ? 'solid' : 'ghost'}
                tone={chosen ? 'primary' : 'neutral'}
                className="icon-gallery-add"
                onClick={() => toggle(name)}
              >
                {chosen ? <CheckIcon /> : <PlusIcon />}
              </IconButton>
              <Stack gap={2} align="center" py={3}>
                <Glyph size={28} />
                <Text variant="caption">{name}</Text>
              </Stack>
              <div className="icon-gallery-actions">
                <Button
                  size="sm"
                  variant="ghost"
                  tone="neutral"
                  aria-label={`Copy the import for ${name}`}
                  onClick={() => copy(importOf([name]), `the import for ${name}`)}
                >
                  Import
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  tone="neutral"
                  aria-label={`Copy the name ${name}`}
                  onClick={() => copy(name, name)}
                >
                  Name
                </Button>
              </div>
            </Tile>
          )
        })}
      </Grid>
      <style>{`
        .icon-gallery-tile { position: relative; padding: var(--greese-space-2); }
        .icon-gallery-tile[data-selected] { border-color: var(--greese-color-primary); box-shadow: inset 0 0 0 1px var(--greese-color-primary); }
        .icon-gallery-add { position: absolute; inset-block-start: var(--greese-space-1); inset-inline-end: var(--greese-space-1); }
        .icon-gallery-actions { display: flex; justify-content: space-between; }
        .icon-gallery-actions .greese-Button { font-size: var(--greese-type-caption-size); min-block-size: 1.75rem; padding-inline: var(--greese-space-2); }
        .icon-gallery-bar { position: sticky; inset-block-start: 0; z-index: 1; background: var(--greese-color-surface-overlay); box-shadow: var(--greese-shadow-md); }
        .icon-gallery-status { min-block-size: 1lh; margin: 0; font-size: var(--greese-type-p3-size); color: var(--greese-color-fg-muted); }
      `}</style>
    </Stack>
  )
}
