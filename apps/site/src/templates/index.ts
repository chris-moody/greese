import type { ComponentType } from 'react'

export interface TemplateEntry {
  /** Its path: `/templates/<id>`. */
  id: string
  /** Its file here, for the source link. */
  file: string
  title: string
  summary: string
  /** The cover's hue in the gallery. */
  hue: number
  /** Its own chunk: the gallery doesn't load the pages. */
  load: () => Promise<ComponentType>
}

/**
 * The page templates, each a self-contained file here: a page made only of
 * GreeseUI components, `@greese/icons` and the few layout rules in
 * templates.scss. They wear whatever theme the header has picked, shapes
 * included. @greese/mcp serves their source too (get_template).
 */
export const TEMPLATES: TemplateEntry[] = [
  {
    id: 'finance',
    file: 'Finance.tsx',
    title: 'Finance',
    summary: 'Net worth, cash flow, budgets, transactions and accounts.',
    hue: 160,
    load: () => import('./Finance.tsx').then((m) => m.Finance),
  },
  {
    id: 'admin',
    file: 'Admin.tsx',
    title: 'Admin dashboard',
    summary: 'Sidebar app shell, KPIs, service status and an orders table.',
    hue: 215,
    load: () => import('./Admin.tsx').then((m) => m.Admin),
  },
  {
    id: 'mail',
    file: 'Mail.tsx',
    title: 'Email client',
    summary: 'Folders, a searchable inbox, a reading pane and compose.',
    hue: 260,
    load: () => import('./Mail.tsx').then((m) => m.Mail),
  },
  {
    id: 'blog',
    file: 'Blog.tsx',
    title: 'Blog and newsletter',
    summary: 'Masthead, topic filters, featured story, posts and subscribe.',
    hue: 20,
    load: () => import('./Blog.tsx').then((m) => m.Blog),
  },
  {
    id: 'saas',
    file: 'Saas.tsx',
    title: 'SaaS landing page',
    summary: 'Hero, features, pricing with a billing switch, FAQ and CTA.',
    hue: 290,
    load: () => import('./Saas.tsx').then((m) => m.Saas),
  },
  {
    id: 'store',
    file: 'Store.tsx',
    title: 'E-commerce store',
    summary: 'Product grid with filters and sorting, and a cart drawer.',
    hue: 40,
    load: () => import('./Store.tsx').then((m) => m.Store),
  },
]
