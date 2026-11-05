'use client'
import { createContext } from 'react'

/**
 * Lets a MenuItem close the menu it was chosen in.
 *
 * Both Menu and ContextMenu provide it, which is why it is here rather than in
 * either of them: a file of its own keeps the two from importing each other,
 * and keeps this `'use client'` boundary off the components that don't need it
 * (ADR 0027). Internal — the package does not export it.
 */
export const MenuContext = createContext<{ close: () => void } | null>(null)
