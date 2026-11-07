import { useState, type JSX } from 'react'
import * as icons from '@greese/icons'
import { CheckIcon, CopyIcon, PlusIcon } from '@greese/icons'
import {
  Button,
  CopyToClipboard,
  Dialog,
  Grid,
  IconButton,
  Stack,
  Text,
  Tile,
} from '@greese/react'
import { NameFilter, useNameFilter } from '../_shared/NameFilter.tsx'

type Icon = (props: icons.IconProps) => JSX.Element

const PACKAGE = '@greese/icons'
const names = Object.keys(icons).filter((name) => /^[A-Z]\w*Icon$/.test(name))
const importOf = (list: string[]) => `import { ${list.join(', ')} } from '${PACKAGE}'`
const glyphOf = (name: string) => icons[name as keyof typeof icons] as Icon

/** The control sizes, as pixels an icon is drawn at beside them. */
const SIZES = [
  ['xs', 12],
  ['sm', 16],
  ['md', 20],
  ['lg', 24],
  ['xl', 32],
] as const

/**
 * Each tone the icon is drawn in, and a background it stands out on: black
 * for white, and the text color, which flips with the scheme, for the others.
 */
const TONES = [
  { name: 'White', color: 'var(--greese-color-white)', on: 'var(--greese-color-black)' },
  { name: 'Primary', color: 'var(--greese-color-primary)', on: 'var(--greese-color-fg)' },
  { name: 'Neutral', color: 'var(--greese-color-fg)', on: 'var(--greese-color-canvas)' },
] as const

/** A code value that copies itself on click, its icon turning into a check. */
const CopyField = ({ label, text }: { label: string; text: string }): JSX.Element => (
  <Stack gap={1}>
    <Text variant="caption" tone="muted">
      {label}
    </Text>
    <CopyToClipboard text={text} copiedMessage={`Copied the ${label.toLowerCase()}`}>
      {({ copied }) => (
        <button
          type="button"
          className="icon-detail-copy"
          aria-label={`Copy the ${label.toLowerCase()}: ${text}`}
        >
          <code>{text}</code>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      )}
    </CopyToClipboard>
  </Stack>
)

/**
 * One icon up close: large on a checkerboard, at every control size, and in
 * each tone with and without a background, with its name and import to copy.
 */
const IconDetail = ({ name }: { name: string }): JSX.Element => {
  const Glyph = glyphOf(name)
  return (
    <div className="icon-detail">
      <div className="icon-detail-hero icon-detail-checker">
        <Glyph size={112} strokeWidth={1.5} />
      </div>
      <Stack gap={4} className="icon-detail-info">
        <CopyField label="Name" text={name} />
        <CopyField label="Import" text={importOf([name])} />
        <Stack gap={1}>
          <Text variant="caption" tone="muted">
            Sizes
          </Text>
          <ul className="icon-detail-sizes">
            {SIZES.map(([size, px]) => (
              <li key={size}>
                <span className="icon-detail-size-box">
                  <Glyph size={px} />
                </span>
                <span className="icon-detail-size-name">
                  {size}
                  <span className="icon-detail-px">{px}px</span>
                </span>
              </li>
            ))}
          </ul>
        </Stack>
      </Stack>
      <section className="icon-detail-tones" aria-label="Tones">
        {TONES.map((tone) => (
          <figure key={tone.name}>
            <div className="icon-detail-swatches">
              <span className="icon-detail-checker" style={{ color: tone.color }}>
                <Glyph size={32} />
              </span>
              <span style={{ color: tone.color, background: tone.on }}>
                <Glyph size={32} />
              </span>
            </div>
            <Text asChild variant="caption">
              <figcaption>{tone.name}</figcaption>
            </Text>
          </figure>
        ))}
      </section>
    </div>
  )
}

/**
 * Every icon in @greese/icons, narrowed by a filter on the name. Each tile
 * copies its import or its name, and opens the icon up close; "+" collects
 * icons into a list, copied as names or as one import.
 */
export const IconGallery = (): JSX.Element => {
  const [selected, setSelected] = useState<string[]>([])
  const [status, setStatus] = useState('')
  // The icon shown stays set while the dialog closes, so it doesn't empty mid-exit.
  const [detail, setDetail] = useState(names[0]!)
  const [open, setOpen] = useState(false)
  const { query, setQuery, matches } = useNameFilter()
  // `Icon` ends every name, so "icon" alone shouldn't match them all.
  const shown = names.filter((name) => matches(name.replace(/Icon$/, '')))

  // One status line for the whole gallery, instead of a live region per tile.
  const copies = (what: string) => ({
    announce: false,
    onCopy: () => setStatus(`Copied ${what}`),
    onCopyError: () => setStatus(`Couldn't copy: your browser blocked the clipboard`),
  })
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
            <CopyToClipboard text={selected.join(', ')} {...copies('the names')}>
              <Button size="sm" variant="soft" startIcon={<CopyIcon />}>
                Copy names
              </Button>
            </CopyToClipboard>
            <CopyToClipboard text={importOf(selected)} {...copies('the import')}>
              <Button size="sm" startIcon={<CopyIcon />}>
                Copy import
              </Button>
            </CopyToClipboard>
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
      <NameFilter
        label="Filter icons"
        query={query}
        onQueryChange={setQuery}
        shown={shown.length}
        total={names.length}
      />
      <p role="status" className="icon-gallery-status">
        {status}
      </p>
      <Grid container minChildWidth="10rem" gap={3}>
        {shown.map((name) => {
          const Glyph = glyphOf(name)
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
              <button
                type="button"
                className="icon-gallery-open"
                aria-haspopup="dialog"
                aria-label={`Show ${name} up close`}
                onClick={() => {
                  setDetail(name)
                  setOpen(true)
                }}
              >
                <Glyph size={28} />
                <Text variant="caption">{name}</Text>
              </button>
              <div className="icon-gallery-actions">
                <CopyToClipboard
                  text={importOf([name])}
                  {...copies(`the import for ${name}`)}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="neutral"
                    startIcon={<CopyIcon />}
                    aria-label={`Copy the import for ${name}`}
                  >
                    Import
                  </Button>
                </CopyToClipboard>
                <CopyToClipboard text={name} {...copies(name)}>
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="neutral"
                    startIcon={<CopyIcon />}
                    aria-label={`Copy the name ${name}`}
                  >
                    Name
                  </Button>
                </CopyToClipboard>
              </div>
            </Tile>
          )
        })}
      </Grid>
      {!shown.length && <Text tone="muted">No icon matches “{query}”.</Text>}
      <Dialog title={detail} size="lg" open={open} onOpenChange={setOpen}>
        <IconDetail name={detail} />
      </Dialog>
      <style>{`
        .icon-gallery-tile { position: relative; padding: var(--greese-space-2); }
        .icon-gallery-tile[data-selected] { border-color: var(--greese-color-primary); box-shadow: inset 0 0 0 1px var(--greese-color-primary); }
        .icon-gallery-add { position: absolute; inset-block-start: var(--greese-space-1); inset-inline-end: var(--greese-space-1); z-index: 1; }
        .icon-gallery-open { display: flex; flex-direction: column; align-items: center; gap: var(--greese-space-2); inline-size: 100%; padding-block: var(--greese-space-3); border: 0; border-radius: var(--greese-radius-md); background: none; color: inherit; font: inherit; cursor: pointer; }
        .icon-gallery-open:hover { background: color-mix(in oklab, var(--greese-color-fg) 6%, transparent); }
        .icon-gallery-open:focus-visible { outline: 2px solid var(--greese-color-focus-ring); outline-offset: 2px; }
        .icon-gallery-actions { display: flex; justify-content: space-between; }
        .icon-gallery-actions .greese-Button { font-size: var(--greese-type-caption-font-size); min-block-size: 1.75rem; padding-inline: var(--greese-space-2); gap: var(--greese-space-1); }
        .icon-gallery-bar { position: sticky; inset-block-start: 0; z-index: 1; background: var(--greese-color-surface-overlay); box-shadow: var(--greese-shadow-md); }
        p.icon-gallery-status { min-block-size: 1lh; margin: 0; font-size: var(--greese-type-p3-font-size); color: var(--greese-color-fg-muted); }

        .icon-detail { display: grid; gap: var(--greese-space-5); grid-template-columns: minmax(0, 1fr); }
        @media (width >= 40rem) { .icon-detail { grid-template-columns: minmax(12rem, 1fr) minmax(0, 1.4fr); } .icon-detail .icon-detail-hero { aspect-ratio: 1; } }
        .icon-detail-checker { background: repeating-conic-gradient(var(--greese-color-track) 0 25%, var(--greese-color-surface) 0 50%) 0 0 / 1rem 1rem; }
        .icon-detail-hero { display: grid; place-items: center; aspect-ratio: 16 / 9; border: 1px solid var(--greese-color-border); border-radius: var(--greese-radius-lg); }
        .icon-detail-info { min-inline-size: 0; }
        .icon-detail-copy { display: flex; align-items: center; justify-content: space-between; gap: var(--greese-space-3); inline-size: 100%; padding: var(--greese-space-2) var(--greese-space-3); border: 1px solid var(--greese-color-border); border-radius: var(--greese-radius-md); background: var(--greese-color-surface); color: var(--greese-color-fg); font: inherit; text-align: start; cursor: copy; }
        .icon-detail-copy:hover { border-color: var(--greese-color-border-strong); }
        .icon-detail-copy:focus-visible { outline: 2px solid var(--greese-color-focus-ring); outline-offset: 2px; }
        .icon-detail-copy code { min-inline-size: 0; overflow-wrap: anywhere; font-size: var(--greese-type-p3-font-size); }
        .icon-detail-copy svg { flex: none; color: var(--greese-color-fg-muted); }
        .icon-detail-copy[data-copy-status='copied'] { border-color: var(--greese-color-positive); }
        .icon-detail-copy[data-copy-status='copied'] svg { color: var(--greese-color-positive); }
        .icon-detail-sizes { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--greese-space-2); margin: 0; padding: 0; list-style: none; }
        .icon-detail-sizes li { margin: 0; display: grid; justify-items: center; align-content: start; gap: var(--greese-space-1); }
        .icon-detail-size-box { display: grid; place-items: center; inline-size: 100%; max-inline-size: 3rem; aspect-ratio: 1; border: 1px dashed var(--greese-color-border); border-radius: var(--greese-radius-sm); }
        .icon-detail-size-name { display: grid; justify-items: center; font-size: var(--greese-type-caption-font-size); line-height: 1.3; }
        .icon-detail-px { font-size: var(--greese-type-caption-font-size); color: var(--greese-color-fg-muted); }
        .icon-detail-tones { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: var(--greese-space-3); }
        .icon-detail-tones figure { margin: 0; display: grid; gap: var(--greese-space-1); }
        .icon-detail-swatches { display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; border: 1px solid var(--greese-color-border); border-radius: var(--greese-radius-md); }
        .icon-detail-swatches span { display: grid; place-items: center; block-size: 4.5rem; }
      `}</style>
    </Stack>
  )
}
