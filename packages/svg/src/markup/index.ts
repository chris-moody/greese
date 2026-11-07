/**
 * `@greese/svg/markup`: SVG as data (ADR 0037). A parser that records where
 * every node and attribute is, a canonical serializer, the sanitizer, defs
 * hoisting, id renaming with reference rewriting, and id adoption across
 * reparses. Pure, and Node-safe: no DOM.
 */
export {
  decodeEntities,
  MarkupError,
  nodeAtOffset,
  parseMarkup,
  TEXT_CONTENT,
  walkMarkup,
  type MarkupNode,
  type ParseMarkupOptions,
  type SourceRange,
} from './parse.ts'
export {
  serializeMarkup,
  serializeMarkupWithRanges,
  type SerializedMarkup,
  type SerializeMarkupOptions,
} from './serialize.ts'
export {
  adoptIds,
  collectIds,
  DEFINITION_TAGS,
  hoistDefs,
  renameIds,
  sanitizeMarkup,
  type MarkupNotice,
  type MarkupResult,
} from './transform.ts'
