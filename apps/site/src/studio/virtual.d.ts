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
