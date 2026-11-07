'use client'
import { useCallback, useState, type JSX } from 'react'
import { Tab, TabList, Tabs } from '@greese/react'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { libraryActions } from '../../state/library.slice.ts'
import {
  selectAssetOrder,
  selectAssets,
  selectLibrarySelection,
} from '../../state/selectors.ts'
import { emptyLayerState } from '../../core/layers/layers.ts'
import { LibraryAssetKind } from '../../core/library/libraryAssetKind.ts'
import { nextLibrarySymbolName } from '../../core/library/symbolNaming.ts'
import type { LibraryAsset } from '../../core/types/library.types.ts'
import { uid } from '../../core/uid.ts'
import { useNavigation } from '../../hooks/useNavigation.ts'
import { useSymbolCreateNaming } from '../../hooks/useSymbolCreateNaming.ts'
import { HierarchicalList } from '../HierarchicalList/HierarchicalList.tsx'
import { LibraryAssetItem, type LibraryAssetItemProps } from './LibraryAssetItem.tsx'
import { SymbolCreateDialog, type SymbolTypeOption } from './SymbolCreateDialog.tsx'

const TYPE_OPTIONS: SymbolTypeOption<LibraryAssetKind>[] = [
  { value: LibraryAssetKind.Graphic, label: 'Graphic' },
  { value: LibraryAssetKind.Animation, label: 'Animation' },
]

export interface LibraryPanelProps {
  /** The list's accessible name. @default 'Library' */
  label?: string
}

/**
 * The editor's library: reusable symbols, by category in tabs when there's
 * more than one. Rename, select and delete them as in any list; Open edits one
 * in its own subview. Add asks for a kind and a name, then opens the new
 * symbol.
 *
 * ```tsx
 * const libraryPanel = { id: 'library', title: 'Library', area: PanelArea.LEFT, component: () => <LibraryPanel /> }
 * ```
 */
export const LibraryPanel = ({ label = 'Library' }: LibraryPanelProps): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const assets = useAuthoringSelector(selectAssets)
  const order = useAuthoringSelector(selectAssetOrder)
  const selection = useAuthoringSelector(selectLibrarySelection)
  const { openAsset } = useNavigation()
  // By name, not index: the categories change as assets come and go.
  const [tab, setTab] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [kind, setKind] = useState<LibraryAssetKind | ''>(LibraryAssetKind.Graphic)
  const naming = useSymbolCreateNaming<LibraryAssetKind>((type) =>
    nextLibrarySymbolName(type, assets)
  )

  const categories = [...new Set([...assets.values()].map((a) => a.category ?? 'symbol'))]
  if (categories.length === 0) categories.push('symbol')
  const active =
    (tab !== null && categories.includes(tab) ? tab : categories[0]) ?? 'symbol'
  const shown = order.filter((id) => (assets.get(id)?.category ?? 'symbol') === active)

  const renderItem = useCallback(
    (data: LibraryAsset, props?: LibraryAssetItemProps) => (
      <LibraryAssetItem data={data} onOpen={openAsset} {...props} />
    ),
    [openAsset]
  )

  const create = () => {
    if (!kind) return
    const id = uid()
    dispatch(
      libraryActions.addAsset({
        id,
        name: naming.name.trim() || nextLibrarySymbolName(kind, assets),
        category: kind,
        removing: false,
        scene: { layerState: emptyLayerState() },
      })
    )
    setCreating(false)
    openAsset(id)
  }

  return (
    <>
      <HierarchicalList<LibraryAsset, LibraryAssetItemProps>
        label={label}
        className="greese-LibraryPanel"
        items={assets}
        itemOrder={shown}
        selectedItems={selection}
        header={
          categories.length > 1 && (
            <Tabs value={active} onValueChange={setTab}>
              <TabList aria-label="Library category">
                {categories.map((category) => (
                  <Tab key={category} value={category}>
                    {category}
                  </Tab>
                ))}
              </TabList>
            </Tabs>
          )
        }
        renderItem={renderItem}
        onSelect={(ids) => dispatch(libraryActions.setSelection([...ids]))}
        onUpdate={(updates) =>
          updates.forEach(({ id, updates: changes }) => {
            if (changes.name !== undefined)
              dispatch(libraryActions.renameAsset({ id, name: changes.name }))
          })
        }
        onAddItem={() => {
          naming.resetForOpen(kind)
          setCreating(true)
        }}
        onDeleteItems={(ids) =>
          ids.forEach((id) => dispatch(libraryActions.removeAsset(id)))
        }
      />
      <SymbolCreateDialog<LibraryAssetKind>
        open={creating}
        types={TYPE_OPTIONS}
        symbolType={kind}
        onChangeSymbolType={(type) => {
          setKind(type)
          naming.notifyTypeChanged(type)
        }}
        name={naming.name}
        onChangeName={naming.setName}
        onClose={() => setCreating(false)}
        onConfirm={create}
      />
    </>
  )
}
