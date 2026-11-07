/**
 * Layer types the framework itself creates: an instance of a library symbol,
 * and a placed image. Graphics editors register these types (with how to draw
 * them) in their `MediaConfig`.
 */
export const SYMBOL_INSTANCE_LAYER_TYPE = 'symbolInstance' as const
export const IMAGE_LAYER_TYPE = 'image' as const
