import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CSSProperties, ReactNode } from 'react'
import { color, fontSize, radius, shadow, space } from '@sauce-ui/tokens'

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
  gap: 'var(--sauce-space-4)',
}
const label: CSSProperties = {
  fontFamily: 'var(--sauce-font-mono)',
  fontSize: 'var(--sauce-font-size-xs)',
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={{ marginBlockEnd: 'var(--sauce-space-7)' }}>
    <h2 style={{ marginBlockEnd: 'var(--sauce-space-4)' }}>{title}</h2>
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
          const v = `--sauce-color-${kebab(role)}`
          return (
            <div key={role}>
              <div
                style={{
                  blockSize: '3rem',
                  background: `var(${v})`,
                  border: '1px solid var(--sauce-color-border)',
                  borderRadius: 'var(--sauce-radius-md)',
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
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--sauce-space-4)' }}
        >
          <code style={{ ...label, inlineSize: '9rem' }}>--sauce-space-{key}</code>
          <div
            style={{
              inlineSize: `var(--sauce-space-${key})`,
              blockSize: '1rem',
              background: 'var(--sauce-color-accent)',
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
                background: 'var(--sauce-color-surface)',
                border: '1px solid var(--sauce-color-border)',
                borderRadius: `var(--sauce-radius-${key})`,
              }}
            />
            <div style={label}>--sauce-radius-{key}</div>
          </div>
        ))}
        {Object.keys(shadow).map((key) => (
          <div key={key}>
            <div
              style={{
                blockSize: '4rem',
                background: 'var(--sauce-color-surface-overlay)',
                borderRadius: 'var(--sauce-radius-md)',
                boxShadow: `var(--sauce-shadow-${key})`,
              }}
            />
            <div style={label}>--sauce-shadow-{key}</div>
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
            fontSize: `var(--sauce-font-size-${key})`,
            marginBlockEnd: 'var(--sauce-space-2)',
          }}
        >
          <code style={label}>--sauce-font-size-{key}</code> The quick brown fox
        </p>
      ))}
    </Section>
  ),
}
