import type { JSX } from 'react'
import '@greese-ui/react/css/Stack.css'
import { GreeseStacks } from './GreeseStacks.tsx'

/**
 * GreeseUI with per-component CSS: only Stack's stylesheet (and the core it
 * imports), as an app that imports `css/<Name>.css` ships. MUI likewise only
 * ever has the styles the page uses.
 */
export const GreeseCssBench = (): JSX.Element => <GreeseStacks />
