/** Joins truthy class names. In-house so the package keeps zero runtime dependencies. */
export const cx = (...classes: Array<string | false | null | undefined>): string => {
  let out = ''
  for (const c of classes) if (c) out = out ? `${out} ${c}` : c
  return out
}
