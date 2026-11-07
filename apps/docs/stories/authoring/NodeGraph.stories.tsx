import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button, Stack, Switch, Text } from '@greese/react'
import {
  NodeGraph,
  type NodeGraphEdge,
  type NodeGraphNode,
  type NodeGraphSource,
} from '@greese/authoring'
import '@greese/authoring/styles.css'

/** A filter's fixed inputs. */
const sources: NodeGraphSource[] = [
  { id: 'SourceGraphic', label: 'SourceGraphic' },
  { id: 'SourceAlpha', label: 'SourceAlpha' },
]

/** A drop shadow: blur the alpha, offset it, merge the shape over it. */
const nodes: NodeGraphNode[] = [
  { id: 'blur', label: 'feGaussianBlur', inputs: ['in'] },
  { id: 'offset', label: 'feOffset', inputs: ['in'] },
  { id: 'merge', label: 'feMerge', inputs: ['in1', 'in2'] },
]

const edges: NodeGraphEdge[] = [
  { from: 'SourceAlpha', to: 'blur', port: 'in' },
  { from: 'blur', to: 'offset', port: 'in' },
  { from: 'offset', to: 'merge', port: 'in1' },
  { from: 'SourceGraphic', to: 'merge', port: 'in2' },
]

const meta = {
  title: 'Authoring/NodeGraph',
  component: NodeGraph,
  args: {
    label: 'Drop shadow',
    sources,
    nodes,
    edges,
    selected: null,
  },
  argTypes: {
    sources: { control: false },
    nodes: { control: false },
    edges: { control: false },
    selected: { control: false },
    onSelect: { control: false },
    onConnect: { control: false },
    onDisconnect: { control: false },
    onRemove: { control: false },
    renderNode: { control: false },
    layout: { control: false },
  },
} satisfies Meta<typeof NodeGraph>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A filter's primitives in columns by depth from its sources. Click a header
 * to select it, or move between them with the arrows; Delete removes one.
 * Each port's menu picks what feeds it, or drag from an output's handle to a
 * port.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [graph, setGraph] = useState({ nodes: args.nodes, edges: args.edges })
    const [selected, setSelected] = useState<string | null>('offset')
    const without = (list: readonly NodeGraphEdge[], to: string, port: string) =>
      list.filter((edge) => edge.to !== to || edge.port !== port)
    const name = graph.nodes.find((node) => node.id === selected)?.label
    return (
      <Stack gap={3}>
        <NodeGraph
          {...args}
          nodes={graph.nodes}
          edges={graph.edges}
          selected={selected}
          onSelect={setSelected}
          onConnect={(edge) =>
            setGraph((g) => ({
              ...g,
              edges: [...without(g.edges, edge.to, edge.port), edge],
            }))
          }
          onDisconnect={({ to, port }) =>
            setGraph((g) => ({ ...g, edges: without(g.edges, to, port) }))
          }
          onRemove={(id) =>
            setGraph((g) => ({
              nodes: g.nodes.filter((node) => node.id !== id),
              edges: g.edges.filter((edge) => edge.to !== id && edge.from !== id),
            }))
          }
        />
        <Stack direction="row" gap={3} align="center">
          <Text variant="caption">Selected: {name ?? 'none'}</Text>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setGraph({ nodes: args.nodes, edges: args.edges })}
          >
            Reset
          </Button>
        </Stack>
      </Stack>
    )
  },
}

/**
 * A host's own body under each node with `renderNode`: here a bypass switch,
 * which dims the node it turns off.
 */
export const WithBodies: Story = {
  render: function WithBodies(args) {
    const [bypassed, setBypassed] = useState<ReadonlySet<string>>(new Set(['blur']))
    const toggle = (id: string, on: boolean) =>
      setBypassed((set) => {
        const next = new Set(set)
        if (on) next.add(id)
        else next.delete(id)
        return next
      })
    return (
      <NodeGraph
        {...args}
        nodes={args.nodes.map((node) => ({ ...node, bypassed: bypassed.has(node.id) }))}
        renderNode={(node) => (
          <Switch
            size="sm"
            label="Bypass"
            aria-label={`Bypass ${node.label}`}
            checked={!!node.bypassed}
            onCheckedChange={(on) => toggle(node.id, on)}
          />
        )}
      />
    )
  },
}
