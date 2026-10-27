import { useState, type JSX } from 'react'
import {
  ActionSelect,
  AutoLayout,
  AutoLayoutItem,
  Break,
  ColorPicker,
  Field,
  Heading,
  MaskedInput,
  Stack,
  Text,
} from '@greese/react'
import '@greese/react/base.css'
import '@greese/react/styles.css'

const Cell = ({ id, label }: { id: string; label: string }) => (
  <div
    data-testid={id}
    style={{ padding: '0.5rem', background: '#e2e8f0', color: '#0f172a' }}
  >
    {label}
  </div>
)

/** Fixtures for e2e/additions.spec.ts: Break and the ported components (ADR 0007's addendum). */
export const Additions = (): JSX.Element => {
  const [raw, setRaw] = useState('')
  const [color, setColor] = useState('#ff0000')
  const [project, setProject] = useState('a')
  const [created, setCreated] = useState(0)
  return (
    <main style={{ padding: '1rem', maxInlineSize: '60rem' }}>
      <Stack gap={6}>
        <Heading level={1} data-testid="heading">
          Ship faster,
          <Break above="md" />
          on every screen
        </Heading>

        <AutoLayout gap={3} data-testid="autolayout">
          <AutoLayoutItem size={{ xs: 12, md: 4 }} maxSize={{ md: 6 }}>
            <Cell id="al-1" label="4 → 6" />
          </AutoLayoutItem>
          <AutoLayoutItem size={{ xs: 12, md: 4 }}>
            <Cell id="al-2" label="4" />
          </AutoLayoutItem>
          <AutoLayoutItem size={{ xs: 12, md: 4 }}>
            <Cell id="al-3" label="4" />
          </AutoLayoutItem>
          <AutoLayoutItem size={{ xs: 12, md: 4 }} maxSize={{ md: 8 }}>
            <Cell id="al-4" label="4 → 8" />
          </AutoLayoutItem>
        </AutoLayout>

        <Field label="Phone">
          <MaskedInput
            mask="(999) 999-9999"
            placeholder="(555) 123-4567"
            onValueChange={setRaw}
          />
        </Field>
        <Text data-testid="phone-raw">{raw}</Text>

        <ColorPicker
          label="Accent"
          value={color}
          onValueChange={setColor}
          swatches={['#00ff00']}
        />
        <Text data-testid="color">{color}</Text>

        <ActionSelect
          data-testid="action-select"
          icon={<span aria-hidden="true">+</span>}
          actionLabel="New project"
          onAction={() => setCreated((n) => n + 1)}
          selectLabel="Project"
          value={project}
          onValueChange={setProject}
          options={[
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ]}
        />
        <Text data-testid="project">
          {project} / {created}
        </Text>
      </Stack>
    </main>
  )
}
