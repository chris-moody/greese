import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CSSProperties, ReactNode } from 'react'
import { color, fontSize, radius, shadow, space } from '@greese-ui/tokens'

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
  gap: 'var(--greese-space-4)',
}
const label: CSSProperties = {
  fontFamily: 'var(--greese-font-mono)',
  fontSize: 'var(--greese-font-size-xs)',
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={{ marginBlockEnd: 'var(--greese-space-7)' }}>
    <h2 style={{ marginBlockEnd: 'var(--greese-space-4)' }}>{title}</h2>
    {children}
  </section>
)

const meta = { title: 'Foundations/Tokens' } satisfies Meta
export default meta

/** Semantic colour roles. Switch the toolbar scheme to see the dark values. */
export const Colors: StoryObj = {
  render: () => (
    <Section title="Colour">
      <div style={grid}>
        {Object.keys(color).map((role) => {
          const v = `--greese-color-${kebab(role)}`
          return (
            <div key={role}>
              <div
                style={{
                  blockSize: '3rem',
                  background: `var(${v})`,
                  border: '1px solid var(--greese-color-border)',
                  borderRadius: 'var(--greese-radius-md)',
                }}
              />
              <div style={label}>{v}</div>
            </div>
          )
        })}
      </div>
    </Section>
  ),
}

export const Space: StoryObj = {
  render: () => (
    <Section title="Space">
      {Object.entries(space).map(([key, value]) => (
        <div
          key={key}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--greese-space-4)' }}
        >
          <code style={{ ...label, inlineSize: '9rem' }}>--greese-space-{key}</code>
          <div
            style={{
              inlineSize: `var(--greese-space-${key})`,
              blockSize: '1rem',
              background: 'var(--greese-color-primary)',
            }}
          />
          <span style={label}>{value}</span>
        </div>
      ))}
    </Section>
  ),
}

export const RadiusAndShadow: StoryObj = {
  render: () => (
    <Section title="Radius and shadow">
      <div style={grid}>
        {Object.keys(radius).map((key) => (
          <div key={key}>
            <div
              style={{
                blockSize: '4rem',
                background: 'var(--greese-color-surface)',
                border: '1px solid var(--greese-color-border)',
                borderRadius: `var(--greese-radius-${key})`,
              }}
            />
            <div style={label}>--greese-radius-{key}</div>
          </div>
        ))}
        {Object.keys(shadow).map((key) => (
          <div key={key}>
            <div
              style={{
                blockSize: '4rem',
                background: 'var(--greese-color-surface-overlay)',
                borderRadius: 'var(--greese-radius-md)',
                boxShadow: `var(--greese-shadow-${key})`,
              }}
            />
            <div style={label}>--greese-shadow-{key}</div>
          </div>
        ))}
      </div>
    </Section>
  ),
}

export const Typography: StoryObj = {
  render: () => (
    <Section title="Font size">
      {Object.keys(fontSize).map((key) => (
        <p
          key={key}
          style={{
            fontSize: `var(--greese-font-size-${key})`,
            marginBlockEnd: 'var(--greese-space-2)',
          }}
        >
          <code style={label}>--greese-font-size-{key}</code> The quick brown fox
        </p>
      ))}
    </Section>
  ),
}
