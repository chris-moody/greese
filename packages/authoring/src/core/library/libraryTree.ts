/**
 * Shared building blocks for a shell's Graphics/Animations library tree —
 * factored out of Armature Studio's `skinLibraryTree.helpers.ts` so
 * NeoPixels' own tree builder doesn't reimplement the same filing/search
 * logic. A shell with additional non-asset rows (Armature's rig-derived
 * Slots folder) builds those separately and merges them with the result
 * here; nothing below assumes there's only ever a Graphics/Animations split.
 */
import { FOLDER_TYPE, type TreeItemModel } from '../types/tree.types.ts'
import type { LibraryAsset } from '../types/library.types.ts'
import { classifyLibraryAsset } from './libraryAssetKind.ts'

/**
 * The loose shape `leafNodesOf`/`filterLibraryTree` operate over — any
 * shell's own node type (e.g. Armature's `SkinLibraryNode`, whose `itemType`
 * additionally covers rig-derived rows like `jointSkin`) satisfies this.
 */
export interface LibraryTreeNode extends TreeItemModel {
  itemType: string
}

/** The concrete node shape `buildLibraryAssetFolders` produces. */
export interface LibraryAssetFolderNode extends LibraryTreeNode {
  itemType: 'folder' | 'graphic' | 'animation' | 'image'
  /** Set on every directly-openable leaf (a project-wide graphic/animation/image asset). */
  assetId?: string
}

export interface LibraryAssetTree<
  TNode extends LibraryTreeNode = LibraryAssetFolderNode,
> {
  items: Map<string, TNode>
  itemOrder: string[]
}

const makeFolder = (id: string, name: string): LibraryAssetFolderNode => ({
  id,
  name,
  type: FOLDER_TYPE,
  itemType: 'folder',
  children: [],
})

export interface BuildLibraryAssetFoldersOptions {
  graphicsFolderId: string
  animationsFolderId: string
  graphicsFolderName?: string
  animationsFolderName?: string
  /**
   * A third, optional Images folder — omitted entirely (no folder built, no
   * `'image'`-kind asset filed anywhere) unless a caller supplies an id, so
   * existing callers (`pixelsLibraryTree.helpers.ts`/`skinLibraryTree.helpers.ts`
   * before they're updated to opt in) see no behavior change.
   */
  imagesFolderId?: string
  imagesFolderName?: string
  /** Excludes an asset id from the built tree entirely — e.g. Armature's skin-slot/skin-clip scratch assets, which get their own rig-derived rows instead. */
  excludeAssetId?: (id: string) => boolean
}

/**
 * Files every project-wide library asset into a Graphics, Animations, or (if
 * `imagesFolderId` is supplied) Images folder via {@link classifyLibraryAsset}.
 * The Graphics/Animations folders are always present (even empty) so a caller
 * merging this into a larger tree has a stable pair of ids to reference; the
 * Images folder is only present when opted into.
 */
export const buildLibraryAssetFolders = (
  assets: Map<string, LibraryAsset>,
  assetOrder: string[],
  options: BuildLibraryAssetFoldersOptions
): LibraryAssetTree => {
  const {
    graphicsFolderId,
    animationsFolderId,
    graphicsFolderName = 'Graphics',
    animationsFolderName = 'Animations',
    imagesFolderId,
    imagesFolderName = 'Images',
    excludeAssetId,
  } = options

  const items = new Map<string, LibraryAssetFolderNode>()
  const graphicsFolder = makeFolder(graphicsFolderId, graphicsFolderName)
  const animationsFolder = makeFolder(animationsFolderId, animationsFolderName)
  const imagesFolder = imagesFolderId
    ? makeFolder(imagesFolderId, imagesFolderName)
    : null

  for (const id of assetOrder) {
    const asset = assets.get(id)
    if (!asset || excludeAssetId?.(id)) continue
    const itemType = classifyLibraryAsset(asset)
    if (itemType === 'image' && imagesFolder && imagesFolderId) {
      items.set(id, {
        id,
        name: asset.name,
        parent: imagesFolderId,
        itemType,
        assetId: id,
      })
      imagesFolder.children!.push(id)
      continue
    }
    const parent = itemType === 'animation' ? animationsFolderId : graphicsFolderId
    items.set(id, { id, name: asset.name, parent, itemType, assetId: id })
    if (itemType === 'animation') animationsFolder.children!.push(id)
    else graphicsFolder.children!.push(id)
  }

  items.set(graphicsFolderId, graphicsFolder)
  items.set(animationsFolderId, animationsFolder)
  const itemOrder = [graphicsFolderId, animationsFolderId]
  if (imagesFolder && imagesFolderId) {
    items.set(imagesFolderId, imagesFolder)
    itemOrder.push(imagesFolderId)
  }

  return { items, itemOrder }
}

/** Every non-folder node in a built tree — what a `SearchProvider` indexes (folder rows aren't searchable content). */
export const leafNodesOf = <TNode extends LibraryTreeNode>(
  tree: LibraryAssetTree<TNode>
): TNode[] => [...tree.items.values()].filter((node) => node.itemType !== 'folder')

/**
 * Filters a built tree down to just the leaf ids in `matchingIds`, plus
 * whichever top-level folder still has at least one surviving child —
 * applies a `SearchProvider` match set to the tree a library panel renders,
 * without re-deriving it. A folder with none of its children matching is
 * dropped from `itemOrder` entirely rather than rendered empty.
 */
export const filterLibraryTree = <TNode extends LibraryTreeNode>(
  tree: LibraryAssetTree<TNode>,
  matchingIds: ReadonlySet<string>
): LibraryAssetTree<TNode> => {
  const items = new Map<string, TNode>()
  const itemOrder: string[] = []
  for (const folderId of tree.itemOrder) {
    const folder = tree.items.get(folderId)
    if (!folder) continue
    const children = (folder.children ?? []).filter((childId) => matchingIds.has(childId))
    if (children.length === 0) continue
    items.set(folderId, { ...folder, children })
    itemOrder.push(folderId)
    for (const childId of children) {
      const child = tree.items.get(childId)
      if (child) items.set(childId, child)
    }
  }
  return { items, itemOrder }
}
