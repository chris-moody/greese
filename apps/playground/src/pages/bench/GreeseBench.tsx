import type { JSX } from 'react'
import '@greese-ui/react/styles.css'
import { GreeseStacks } from './GreeseStacks.tsx'

/** GreeseUI with the whole stylesheet (`styles.css`), the default setup. */
export const GreeseBench = (): JSX.Element => <GreeseStacks />
