/**
 * A Prism grammar for SCSS, registered with Storybook's syntax highlighter,
 * which ships CSS but not SCSS. Covers what the docs show: `//` comments,
 * `@use`/`@include`/`@mixin`, `$variables`, `#{…}` interpolation and module
 * calls (`greese.token(…)`). Modelled on Prism's own scss grammar, trimmed.
 */
type Grammar = Record<string, unknown>
interface PrismLike {
  languages: Record<string, Grammar> & {
    extend: (id: string, grammar: Grammar) => Grammar
    insertBefore: (inside: string, before: string, insert: Grammar) => void
  }
}

export const scss = (Prism: PrismLike): void => {
  Prism.languages.scss = Prism.languages.extend('css', {
    comment: { pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/, lookbehind: true },
    atrule: {
      pattern: /@[\w-](?:\([^()]+\)|[^()\s]|\s+(?!\s))*?(?=\s+[{;])/,
      inside: { rule: /@[\w-]+/ },
    },
    url: /(?:[-a-z]+-)?url(?=\()/i,
    selector: {
      pattern:
        /(?=\S)[^@;{}()]?(?:[^@;{}()\s]|\s+(?!\s)|#\{\$[-\w]+\})+(?=\s*\{(?:\}|\s|[^}][^:{}]*[:{][^}]))/,
      inside: { placeholder: /%[-\w]+/, variable: /\$[-\w]+|#\{\$[-\w]+\}/ },
    },
    property: {
      pattern: /(?:[-\w]|\$[-\w]|#\{\$[-\w]+\})+(?=\s*:)/,
      inside: { variable: /\$[-\w]+|#\{\$[-\w]+\}/ },
    },
  })
  Prism.languages.insertBefore('scss', 'atrule', {
    keyword: [
      /@(?:content|debug|each|else(?: if)?|error|extend|for|forward|function|if|import|include|mixin|return|use|warn|while)\b/i,
      { pattern: /( )(?:as|from|through|to|with)(?= )/, lookbehind: true },
    ],
  })
  Prism.languages.insertBefore('scss', 'important', {
    variable: /\$[-\w]+|#\{\$[-\w]+\}/,
  })
  Prism.languages.insertBefore('scss', 'function', {
    'module-function': { pattern: /\b[\w-]+\.[\w-]+(?=\()/, alias: 'function' },
    placeholder: { pattern: /%[-\w]+/, alias: 'selector' },
    statement: { pattern: /\B!(?:default|optional)\b/i, alias: 'keyword' },
    boolean: /\b(?:false|true)\b/,
    null: { pattern: /\bnull\b/, alias: 'keyword' },
    operator: {
      pattern: /(\s)(?:[-+*/%]|[=!]=|<=?|>=?|and|not|or)(?=\s)/,
      lookbehind: true,
    },
  })
}
scss.displayName = 'scss'
scss.aliases = [] as string[]
