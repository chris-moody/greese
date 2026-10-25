declare module 'virtual:greese-stylesheet' {
  /** The rest of the stylesheet's SCSS by path (server/kitSources.ts). */
  const files: Record<string, string>
  export default files
}

declare module 'virtual:greese-kit' {
  /** The SCSS kit's partials by virtual path (server/kitSources.ts). */
  const files: Record<string, string>
  export default files
}

declare module 'virtual:greese-utilities.css' {
  /** The utility classes this app's source uses (@greese/ui/vite). */
}

declare module 'virtual:greese-docs' {
  /** Every docs page, in the docs' order (server/docsIndex.ts). */
  const pages: import('../../server/docsIndex.ts').DocsPage[]
  export default pages
}

declare module 'virtual:greese-docgen' {
  /** Every component's description and props, by name (server/docgen.ts). */
  const docs: Record<string, import('../../server/docgen.ts').ComponentDoc>
  export default docs
}
