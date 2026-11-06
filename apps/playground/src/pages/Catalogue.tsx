import { useEffect, useState, type JSX } from 'react'
import { InfoIcon } from '@greese/icons'
import {
  Carousel,
  CarouselSlide,
  ScrollCarousel,
  ScrollCarouselSlide,
  Diff,
  Field,
  OtpField,
  Rating,
  SpeedDial,
  ThemeProvider,
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

const Glyph = () => <InfoIcon />

/**
 * Deep links are the app's, not Carousel's: here the hash names the tour's
 * slide. Read before the first render, so the page opens on it; followed on
 * `hashchange`; and written as the user moves, without adding history.
 */
const stops = ['tour-1', 'tour-2', 'tour-3']
const hashStop = () => Math.max(0, stops.indexOf(location.hash.slice(1)))
const useHashStop = () => {
  const [stop, setStop] = useState(hashStop)
  useEffect(() => {
    const follow = () => setStop(hashStop())
    addEventListener('hashchange', follow)
    return () => removeEventListener('hashchange', follow)
  }, [])
  const move = (i: number) => {
    setStop(i)
    history.replaceState(history.state, '', `#${stops[i]}`)
  }
  return [stop, move] as const
}

/** Fixtures for e2e/catalogue.spec.ts: the components from ADR 0011. */
export const Catalogue = (): JSX.Element => {
  const [slide, setSlide] = useState(0)
  const [stop, setStop] = useHashStop()
  const [controlled, setControlled] = useState(0)
  const [split, setSplit] = useState(50)
  const [code, setCode] = useState('')
  const [action, setAction] = useState('')
  return (
    <main style={{ padding: '1rem', maxInlineSize: '40rem' }}>
      <Stack gap={6}>
        <ScrollCarousel label="Colors" onIndexChange={setSlide} data-testid="carousel">
          {[0, 90, 180, 270].map((hue) => (
            <ScrollCarouselSlide key={hue}>
              <div style={tile(hue)} />
            </ScrollCarouselSlide>
          ))}
        </ScrollCarousel>
        <output data-testid="slide">{slide}</output>

        <Carousel label="Tour" index={stop} onIndexChange={setStop} data-testid="tour">
          {[0, 120, 240].map((hue) => (
            <CarouselSlide key={hue}>
              <div style={tile(hue)} />
            </CarouselSlide>
          ))}
        </Carousel>
        <a href="#tour-3">To the last stop</a>

        <Carousel label="Faded" enter="fadeIn" exit="fadeOut">
          {[45, 165].map((hue) => (
            <CarouselSlide key={hue}>
              <div style={tile(hue)} />
            </CarouselSlide>
          ))}
        </Carousel>

        {/* An app's own Reduce motion switch. */}
        <ThemeProvider motion="reduce">
          <Carousel label="Reduced">
            {[90, 270].map((hue) => (
              <CarouselSlide key={hue}>
                <div style={tile(hue)} />
              </CarouselSlide>
            ))}
          </Carousel>
          <ScrollCarousel label="Reduced scroll">
            {[100, 200, 300].map((hue) => (
              <ScrollCarouselSlide key={hue}>
                <div style={tile(hue)} />
              </ScrollCarouselSlide>
            ))}
          </ScrollCarousel>
        </ThemeProvider>

        {/* Controlled, with buttons of the page's own. */}
        <ScrollCarousel
          label="Controlled"
          index={controlled}
          onIndexChange={setControlled}
        >
          {[30, 120, 210, 300].map((hue) => (
            <ScrollCarouselSlide key={hue}>
              <div style={tile(hue)} />
            </ScrollCarouselSlide>
          ))}
        </ScrollCarousel>
        <Stack direction="row" gap={2}>
          <button type="button" onClick={() => setControlled((i) => Math.max(0, i - 1))}>
            Back
          </button>
          <button type="button" onClick={() => setControlled((i) => Math.min(3, i + 1))}>
            Forward
          </button>
          <output data-testid="controlled">{controlled}</output>
        </Stack>

        <ScrollCarousel
          label="Vertical"
          orientation="vertical"
          style={{ inlineSize: '16rem' }}
        >
          {[60, 150, 240].map((hue) => (
            <ScrollCarouselSlide key={hue}>
              <div style={{ ...tile(hue), blockSize: '100%' }} />
            </ScrollCarouselSlide>
          ))}
        </ScrollCarousel>

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
