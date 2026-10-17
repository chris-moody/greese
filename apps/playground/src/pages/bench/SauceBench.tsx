import type { JSX } from 'react'
import { Stack } from '@sauce-ui/react'
import '@sauce-ui/react/styles.css'
import { CARDS, Harness } from './Harness.tsx'

/** Gaps in px: normal 8/16, dense 4/8 (identical to MuiBench). */
const gaps = (dense: boolean) =>
  dense ? ({ xs: 1, md: 2 } as const) : ({ xs: 2, md: 4 } as const)

export const SauceBench = (): JSX.Element => (
  <Harness
    render={(dense) => (
      <Stack gap={gaps(dense)}>
        {CARDS.map((i) => (
          <Stack
            key={i}
            direction={{ xs: 'column', md: 'row' }}
            gap={gaps(dense)}
            align="center"
          >
            <Stack direction="row" gap={gaps(dense)} align="center">
              <span>#{i}</span>
              <Stack gap={gaps(dense)}>
                <span>Title</span>
                <span>Subtitle</span>
              </Stack>
            </Stack>
            <Stack
              direction={{ xs: 'row', lg: 'column' }}
              gap={gaps(dense)}
              justify="end"
            >
              <Stack direction="row" gap={gaps(dense)}>
                <span>A</span>
                <span>B</span>
              </Stack>
            </Stack>
          </Stack>
        ))}
      </Stack>
    )}
  />
)
