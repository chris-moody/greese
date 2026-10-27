import type { JSX } from 'react'
import {
  Button,
  Icon,
  Segment,
  SegmentedControl,
  useColorScheme,
  type ColorScheme,
} from '@greese/react'
import { icons } from '../../icons.tsx'

/** The color scheme from md: light, auto and dark, as icons. */
export const SchemeControl = (): JSX.Element => {
  const { scheme, setScheme } = useColorScheme()
  return (
    <SegmentedControl
      label="Color scheme"
      hideLabel
      size="sm"
      value={scheme}
      onValueChange={(v) => setScheme(v as ColorScheme)}
      greese={{ enter: 'fadeIn', delay: 0.2 }}
    >
      <Segment value="light">
        <Icon label="Light">{icons.sun}</Icon>
      </Segment>
      <Segment value="system">
        <Icon label="Auto">{icons.auto}</Icon>
      </Segment>
      <Segment value="dark">
        <Icon label="Dark">{icons.moon}</Icon>
      </Segment>
    </SegmentedControl>
  )
}

/**
 * The scheme on phones: a soft icon button showing the current scheme's
 * icon, so themes style it as they style its peers. A native select fills it
 * invisibly, giving the menu, keyboard and screen-reader name for free.
 */
export const SchemeSelect = (): JSX.Element => {
  const { scheme, setScheme } = useColorScheme()
  return (
    <Button
      asChild
      size="sm"
      variant="soft"
      tone="neutral"
      className="greese-IconButton site-scheme-select"
      startIcon={
        <Icon>
          {scheme === 'light' ? icons.sun : scheme === 'dark' ? icons.moon : icons.auto}
        </Icon>
      }
    >
      <span>
        <select
          aria-label="Color scheme"
          value={scheme}
          onChange={(e) => setScheme(e.currentTarget.value as ColorScheme)}
        >
          <option value="light">Light</option>
          <option value="system">Auto</option>
          <option value="dark">Dark</option>
        </select>
      </span>
    </Button>
  )
}
