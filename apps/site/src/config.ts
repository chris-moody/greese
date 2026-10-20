/**
 * Links the site points at. Storybook is deployed beside the app, at
 * `<base>storybook/`, by .github/workflows/pages.yml; Theme Studio is one of
 * the app's own routes (router.tsx).
 */
import { BASE } from './router.tsx'

export const REPO_URL = 'https://github.com/chris-moody/greese'
export const DOCS_URL = `${BASE}storybook/`
export const INSTALL = 'npm install @greese/react'
