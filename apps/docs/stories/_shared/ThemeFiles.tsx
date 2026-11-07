import { useMemo, useState, type JSX } from 'react'
import { Accordion, AccordionItem, Text } from '@greese/react'
import { DocumentIcon, FolderFilledIcon, FolderIcon } from '@greese/icons'
import { CodeEditor, type CodeLanguage as Language } from '@greese/authoring'
import '@greese/authoring/styles.css'
import { sampleFiles } from './themeLayoutSample.ts'
import './themeFiles.css'

/** A folder of the tree: its files, then its folders, by name. */
interface Folder {
  files: string[]
  folders: Map<string, Folder>
}

const folder = (): Folder => ({ files: [], folders: new Map() })

/** Paths as a tree of folders. */
const treeOf = (paths: string[]): Folder => {
  const root = folder()
  for (const path of paths) {
    const parts = path.split('/')
    let at = root
    for (const name of parts.slice(0, -1)) {
      if (!at.folders.has(name)) at.folders.set(name, folder())
      at = at.folders.get(name)!
    }
    at.files.push(path)
  }
  return root
}

const LANGUAGES: Record<string, Language> = {
  scss: 'scss',
  css: 'css',
  ts: 'ts',
  json: 'js',
}

const languageOf = (path: string): Language =>
  LANGUAGES[path.slice(path.lastIndexOf('.') + 1)] ?? 'scss'

const nameOf = (path: string): string => path.slice(path.lastIndexOf('/') + 1)

/** A folder's entry point first (`main.scss`, `_index.scss`), then by name. */
const byEntry = (a: string, b: string): number => {
  const rank = (p: string) => (/(^|\/)(main|_index)\.scss$/.test(p) ? 0 : 1)
  return rank(a) - rank(b) || nameOf(a).localeCompare(nameOf(b))
}

const Files = ({
  at,
  chosen,
  onChoose,
  open,
}: {
  at: Folder
  chosen: string
  onChoose: (path: string) => void
  /** The folders open at first, by name. */
  open: ReadonlySet<string>
}): JSX.Element => (
  <>
    {at.folders.size > 0 && (
      <Accordion
        className="theme-files-folders"
        icon={<FolderFilledIcon />}
        openIcon={<FolderIcon />}
        iconTransition="none"
      >
        {[...at.folders]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, inside]) => (
            <AccordionItem key={name} title={`${name}/`} defaultOpen={open.has(name)}>
              <Files at={inside} chosen={chosen} onChoose={onChoose} open={open} />
            </AccordionItem>
          ))}
      </Accordion>
    )}
    {at.files.length > 0 && (
      <ul className="theme-files-list">
        {[...at.files].sort(byEntry).map((path) => (
          <li key={path}>
            <button
              type="button"
              className="theme-files-file"
              aria-current={path === chosen ? 'true' : undefined}
              onClick={() => onChoose(path)}
            >
              <DocumentIcon />
              {nameOf(path)}
            </button>
          </li>
        ))}
      </ul>
    )}
  </>
)

/**
 * The files Theme Studio saves for a theme, as a tree to browse: folders open
 * and close (a solid folder is closed), and the chosen file shows read-only.
 * They're `specToLayout()`'s real output for the guide's sample theme
 * (`themeLayoutSample.ts`), so they never drift from what the studio writes.
 */
export const ThemeFiles = ({
  files: given,
  initial = 'greese-theme/main.scss',
  open = ['greese-theme'],
}: {
  /** The files by path. @default the guide's sample theme */
  files?: Record<string, string>
  /** The file shown first. */
  initial?: string
  /** The folders open at first, by name. */
  open?: string[]
}): JSX.Element => {
  const files = useMemo(() => given ?? sampleFiles(), [given])
  const tree = useMemo(() => treeOf(Object.keys(files)), [files])
  const [chosen, setChosen] = useState(files[initial] === undefined ? '' : initial)
  const text = files[chosen]
  return (
    <div className="theme-files">
      <nav className="theme-files-tree" aria-label="Theme files">
        <Files at={tree} chosen={chosen} onChoose={setChosen} open={new Set(open)} />
      </nav>
      <div className="theme-files-view">
        <Text variant="p3" tone="muted" className="theme-files-path">
          {text === undefined ? 'Choose a file' : chosen}
        </Text>
        {text !== undefined && (
          <CodeEditor
            // Storybook's docs style every div and `code` they hold; the box
            // must keep exactly the textarea's font and padding.
            className="sb-unstyled"
            key={chosen}
            value={text}
            language={languageOf(chosen)}
            rows={Math.min(Math.max(text.split('\n').length, 8), 28)}
            readOnly
            aria-label={`${chosen}, read-only`}
          />
        )}
      </div>
    </div>
  )
}
