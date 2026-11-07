import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  FOLDER_TYPE,
  HierarchicalList,
  HierarchicalListFolder,
  HierarchicalListItem,
  type TreeItemModel,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

const seed: TreeItemModel[] = [
  { id: 'bg', name: 'Background' },
  { id: 'chars', name: 'Characters', type: FOLDER_TYPE, children: ['hero', 'sidekick'] },
  { id: 'hero', name: 'Hero', parent: 'chars' },
  { id: 'sidekick', name: 'Sidekick', parent: 'chars' },
  { id: 'title', name: 'Title' },
]
const seedOrder = ['bg', 'chars', 'title']

const meta = {
  title: 'Authoring/HierarchicalList',
  component: HierarchicalList,
  subcomponents: { HierarchicalListItem, HierarchicalListFolder },
  args: {
    label: 'Layers',
    items: new Map(seed.map((item) => [item.id, item])),
    itemOrder: seedOrder,
    selectedItems: new Set<string>(),
  },
  argTypes: {
    items: { control: false },
    itemOrder: { control: false },
    selectedItems: { control: false },
  },
} satisfies Meta<typeof HierarchicalList>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A tree to select, reorder and nest. Click selects (Shift for a range,
 * Cmd/Ctrl to toggle), the arrow keys move through it (Right opens a folder,
 * Left closes it), F2 or a double-click renames, Delete removes. Drag rows
 * above, below or into the folder. The actions bar adds rows and folders and
 * deletes the selection.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [items, setItems] = useState(() => new Map(seed.map((item) => [item.id, item])))
    const [order, setOrder] = useState(seedOrder)
    const [selected, setSelected] = useState(new Set<string>(['bg']))
    const [count, setCount] = useState(1)

    const add = (folder: boolean) => {
      const id = `${folder ? 'folder' : 'layer'}-${count}`
      const name = folder ? `Folder ${count}` : `Layer ${count}`
      setCount((n) => n + 1)
      setItems((all) =>
        new Map(all).set(id, {
          id,
          name,
          ...(folder && { type: FOLDER_TYPE, children: [] }),
        })
      )
      setOrder((ids) => [id, ...ids])
      setSelected(new Set([id]))
    }

    return (
      <div style={{ blockSize: '20rem', maxInlineSize: '20rem' }}>
        <HierarchicalList
          {...args}
          items={items}
          itemOrder={order}
          selectedItems={selected}
          onSelect={setSelected}
          onItemOrderChange={setOrder}
          onUpdate={(updates) =>
            setItems((all) => {
              const next = new Map(all)
              for (const { id, updates: changes } of updates)
                next.set(id, { ...next.get(id)!, ...changes })
              return next
            })
          }
          onDeleteItems={(ids) =>
            setItems((all) => {
              const next = new Map(all)
              for (const id of ids) next.delete(id)
              return next
            })
          }
          onAddItem={() => add(false)}
          onAddFolder={() => add(true)}
        />
      </div>
    )
  },
}

/** With `flat`, every row sits at the first level: nesting still hides children. */
export const Flat: Story = {
  args: { flat: true, collapsedIds: new Set<string>() },
}
