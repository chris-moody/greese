/** A camelCase name as CSS writes it: `surfaceOverlay` → `surface-overlay`. */
export const kebab = (value: string): string =>
  value.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
