/** `surfaceOverlay` -> `surface-overlay`, `2xl` -> `2xl`. */
export const kebab = (value: string): string =>
  value.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
