const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * A random id for layout nodes and other editor records: 16 characters from
 * 62, about 95 bits. `crypto.getRandomValues` rather than `randomUUID`,
 * which browsers only offer in secure contexts, and an editor is often opened
 * over plain HTTP on a LAN to test on a phone.
 *
 * ```ts
 * const leaf = { kind: 'leaf', id: uid(), tabs: ['layers'] }
 * ```
 */
export const uid = (size = 16): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  let id = ''
  // 62 doesn't divide 256, so a modulo would favour the first 8 characters
  // slightly; that doesn't matter for ids that only need to be unique.
  for (const byte of bytes) id += ALPHABET[byte % 62]
  return id
}
