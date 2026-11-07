import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  HierarchicalList,
  HierarchicalListItem,
  type TreeItemModel,
} from '@greese/authoring'
import { EyeIcon, EyeOffIcon } from '@greese/icons'
import { IconButton } from '@greese/react'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/HierarchicalListItem',
  component: HierarchicalListItem,
  args: { data: { id: 'title', name: 'Title' } },
  argTypes: { data: { control: false } },
  decorators: [
    (Story) => (
      <div role="tree" aria-label="Layers" style={{ maxInlineSize: '20rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HierarchicalListItem>
export default meta

type Story = StoryObj<typeof meta>

/** A row, renamed in place by double-click or F2. A list gives it its depth and handlers. */
export const Playground: Story = {}

/**
 * A custom row: `renderItem` gets the list's props for each row and spreads
 * them onto `HierarchicalListItem`, adding an icon at its end.
 */
export const WithIcon: Story = {
  decorators: [(Story) => <Story />],
  render: function WithIcon() {
    const [hidden, setHidden] = useState(new Set<string>())
    const items = new Map<string, TreeItemModel>([
      ['bg', { id: 'bg', name: 'Background' }],
      ['title', { id: 'title', name: 'Title' }],
    ])
    const toggle = (id: string) =>
      setHidden((all) => {
        const next = new Set(all)
        if (!next.delete(id)) next.add(id)
        return next
      })
    return (
      <div style={{ maxInlineSize: '20rem' }}>
        <HierarchicalList
          label="Layers"
          items={items}
          itemOrder={['bg', 'title']}
          selectedItems={new Set()}
          renderItem={(data, props) => (
            <HierarchicalListItem
              data={data}
              {...props}
              iconPosition="end"
              icon={
                <IconButton
                  size="sm"
                  tabIndex={-1}
                  label={hidden.has(data.id) ? `Show ${data.name}` : `Hide ${data.name}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggle(data.id)
                  }}
                >
                  {hidden.has(data.id) ? <EyeOffIcon /> : <EyeIcon />}
                </IconButton>
              }
            />
          )}
        />
      </div>
    )
  },
}
