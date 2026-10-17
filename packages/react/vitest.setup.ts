import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { installMatchMedia } from './src/test/matchMedia.ts'

// Node-environment test files (e.g. SCSS compilation) have no window.
if (typeof window !== 'undefined') installMatchMedia()

// Testing Library only auto-cleans when test globals are enabled; they are not.
afterEach(cleanup)
