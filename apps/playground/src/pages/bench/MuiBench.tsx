import type { JSX } from 'react'
import Stack from '@mui/material/Stack'
import { CARDS, Harness } from './Harness.tsx'

/**
 * MUI spacing unit is 8px: normal 8/16, dense 4/8 (identical to SauceBench).
 * MUI 9 removed Stack's system props, so alignment goes through `sx`, as an
 * MUI app would write it.
 */
const spacing = (dense: boolean) => (dense ? { xs: 0.5, md: 1 } : { xs: 1, md: 2 })

export const MuiBench = (): JSX.Element => (
  <Harness
    render={(dense) => (
      <Stack spacing={spacing(dense)} useFlexGap>
        {CARDS.map((i) => (
          <Stack
            key={i}
            direction={{ xs: 'column', md: 'row' }}
            spacing={spacing(dense)}
            useFlexGap
            sx={{ alignItems: 'center' }}
          >
            <Stack
              direction="row"
              spacing={spacing(dense)}
              useFlexGap
              sx={{ alignItems: 'center' }}
            >
              <span>#{i}</span>
              <Stack spacing={spacing(dense)} useFlexGap>
                <span>Title</span>
                <span>Subtitle</span>
              </Stack>
            </Stack>
            <Stack
              direction={{ xs: 'row', lg: 'column' }}
              spacing={spacing(dense)}
              useFlexGap
              sx={{ justifyContent: 'flex-end' }}
            >
              <Stack direction="row" spacing={spacing(dense)} useFlexGap>
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
