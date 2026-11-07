import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { installTopLayer } from './src/test/topLayer.ts'

// jsdom has no <dialog> top layer or Popover API; Dialog needs both.
if (typeof window !== 'undefined') installTopLayer()

// Testing Library only auto-cleans when test globals are enabled; they are not.
afterEach(cleanup)
