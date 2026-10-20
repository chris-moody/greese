import { useState, type JSX } from 'react'
import {
  ScrollCarousel,
  ScrollCarouselSlide,
  Diff,
  Field,
  OtpField,
  Rating,
  SpeedDial,
  SpeedDialAction,
  Stack,
  Steps,
  Step,
  Swap,
} from '@greese/react'
import '@greese/react/base.css'
import '@greese/react/styles.css'

const tile = (hue: number) => ({
  blockSize: '10rem',
  borderRadius: '8px',
  background: `hsl(${hue} 60% 45%)`,
})

const Glyph = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="5" fill="currentColor" />
  </svg>
)

/** Fixtures for e2e/catalogue.spec.ts: the components from ADR 0011. */
export const Catalogue = (): JSX.Element => {
  const [slide, setSlide] = useState(0)
  const [split, setSplit] = useState(50)
  const [code, setCode] = useState('')
  const [action, setAction] = useState('')
  return (
    <main style={{ padding: '1rem', maxInlineSize: '40rem' }}>
      <Stack gap={6}>
        <ScrollCarousel label="Colours" onIndexChange={setSlide} data-testid="carousel">
          {[0, 90, 180, 270].map((hue) => (
            <ScrollCarouselSlide key={hue}>
              <div style={tile(hue)} />
            </ScrollCarouselSlide>
          ))}
        </ScrollCarousel>
        <output data-testid="slide">{slide}</output>

        <Diff
          label="Comparison"
          onValueChange={setSplit}
          style={{ blockSize: '12rem' }}
          before={<div style={tile(200)} />}
          after={<div style={tile(20)} />}
          data-testid="diff"
        />
        <output data-testid="split">{split}</output>

        <Field label="Code">
          <OtpField length={6} onComplete={setCode} />
        </Field>
        <output data-testid="code">{code}</output>

        <Rating label="Rating" defaultValue={2} hideLabel={false} />
        <Rating label="Halves" step={0.5} defaultValue={1} hideLabel={false} />

        <Steps current={1} aria-label="Progress">
          <Step>One</Step>
          <Step>Two</Step>
          <Step>Three</Step>
        </Steps>

        <Swap label="Dark mode" off="☀" on="☾" />

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingBlockStart: '8rem',
          }}
        >
          <SpeedDial label="Create" position="static">
            <SpeedDialAction
              label="Document"
              icon={<Glyph />}
              onClick={() => setAction('doc')}
            />
            <SpeedDialAction
              label="Folder"
              icon={<Glyph />}
              onClick={() => setAction('folder')}
            />
          </SpeedDial>
        </div>
        <output data-testid="action">{action}</output>
      </Stack>
    </main>
  )
}
