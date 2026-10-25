import '../styles/library.ts'
import type { JSX } from 'react'
import { useShell } from '../shell.ts'
import { ThemeMenu } from './ThemeMenu.tsx'

/** The header's theme menu, wired to the shared theme. */
export const ThemeSelector = (): JSX.Element => {
  const { spec, setSpec, rendered } = useShell()
  return <ThemeMenu spec={spec} onChange={setSpec} rendered={rendered} />
}
