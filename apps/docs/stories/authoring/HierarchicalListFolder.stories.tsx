import type { Meta, StoryObj } from '@storybook/react-vite'
import { FOLDER_TYPE, HierarchicalList, HierarchicalListFolder } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/HierarchicalListFolder',
  component: HierarchicalListFolder,
  args: {
    data: { id: 'chars', name: 'Characters', type: FOLDER_TYPE, children: ['hero'] },
    open: false,
  },
  argTypes: { data: { control: false } },
  decorators: [
    (Story) => (
      <div role="tree" aria-label="Layers" style={{ maxInlineSize: '20rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HierarchicalListFolder>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A folder row and its toggle. In a list, the list owns whether it's open,
 * so the toggle and the arrow keys agree.
 */
export const Playground: Story = {}

/** Inside a list: the folder opens by its toggle, or by Right on the focused row. */
export const InAList: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <div style={{ maxInlineSize: '20rem' }}>
      <HierarchicalList
        label="Layers"
        items={
          new Map([
            [
              'chars',
              {
                id: 'chars',
                name: 'Characters',
                type: FOLDER_TYPE,
                children: ['hero', 'sidekick'],
              },
            ],
            ['hero', { id: 'hero', name: 'Hero', parent: 'chars' }],
            ['sidekick', { id: 'sidekick', name: 'Sidekick', parent: 'chars' }],
          ])
        }
        itemOrder={['chars']}
        selectedItems={new Set()}
      />
    </div>
  ),
}
