/**
 * The complete source of a story whose `render` keeps state: "Show code" for
 * these prints what the story file says, not what it rendered. A render's
 * output can't show its hooks (`useState`) or the handlers that use them, so
 * the snippet would never run. Each one becomes a component that does:
 *
 * - the imports it uses, and only those names;
 * - the module's own declarations it uses (a `const stroke`, a helper
 *   component), and theirs in turn;
 * - `const args = …` when the render reads its args, from the file's meta
 *   and the story's own;
 * - the render itself, as `export const <Story> = () => …`.
 *
 * Stories without hooks keep the JSX generated from what they render, which
 * is shorter and shows the args a reader has set.
 *
 * Shared by Storybook (`main.ts`) and the web app (`server/storyNames.ts`),
 * which set it as each story's `parameters.docs.source.code`.
 */
import ts from 'typescript'

/**
 * Code whose output can't be printed back: it calls a hook, or hands an
 * element a function of its own (`onClick={() => toast(…)}`), which the
 * rendered element only knows as a function.
 */
const STATEFUL = /\buse[A-Z]\w*\s*\(|\bon[A-Z]\w*=\{/

const IDENT = /\b[A-Za-z_$][\w$]*\b/g

/** Removes the indentation every non-blank line shares. */
const dedent = (text: string): string => {
  const lines = text.split('\n')
  const indent = Math.min(
    ...lines
      .slice(1)
      .filter((l) => l.trim())
      .map((l) => /^ */.exec(l)![0].length)
  )
  return [
    lines[0],
    ...lines.slice(1).map((l) => l.slice(Number.isFinite(indent) ? indent : 0)),
  ].join('\n')
}

const used = (text: string): Set<string> => new Set(text.match(IDENT) ?? [])

/**
 * The meta's and the story's args as one literal, as Storybook merges them:
 * a story's arg replaces the meta's of the same name, in its place.
 */
const literal = (
  objects: (ts.Expression | undefined)[],
  source: ts.SourceFile
): string => {
  const props = new Map<string, string>()
  let spread = 0
  for (const o of objects) {
    const object = objectOf(o)
    for (const p of object?.properties ?? [])
      props.set(p.name ? p.name.getText(source) : `...${spread++}`, p.getText(source))
  }
  // `as const`: the literal types (`'popIn'`) props expect, not `string`.
  return props.size ? `{ ${[...props.values()].join(', ')} } as const` : '{}'
}

const property = (node: ts.ObjectLiteralExpression, name: string) =>
  node.properties.find(
    (p): p is ts.PropertyAssignment | ts.MethodDeclaration =>
      (ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p)) &&
      p.name.getText() === name
  )

const objectOf = (expression: ts.Expression | undefined) => {
  let e = expression
  while (
    e &&
    (ts.isSatisfiesExpression(e) ||
      ts.isAsExpression(e) ||
      ts.isParenthesizedExpression(e))
  )
    e = e.expression
  return e && ts.isObjectLiteralExpression(e) ? e : undefined
}

/** The render as a component: `export const Name = () => …`. */
const asComponent = (name: string, render: ts.Node, param: string | undefined) => {
  const readsArgs = param !== undefined
  let body: string
  if (ts.isMethodDeclaration(render) || ts.isFunctionExpression(render)) {
    body = render.body ? render.body.getText() : '{}'
  } else if (ts.isArrowFunction(render)) {
    body = render.body.getText()
  } else return undefined
  const arrow = ts.isArrowFunction(render) && !ts.isBlock(render.body)
  const head = `export const ${name} = () =>`
  if (!readsArgs) return `${head} ${dedent(body)}`
  const args = `const ${param} = { ...metaArgs, ...storyArgs }`
  return arrow
    ? `${head} {\n  ${args}\n  return ${dedent(body)}\n}`
    : `${head} {\n  ${args}\n${dedent(body).replace(/^\{\n?/, '')}`
}

/**
 * The snippet for each story export whose render calls a hook, by export
 * name. Pure: the file's text in, the snippets out.
 */
export const storySources = (
  code: string,
  fileName = 'story.tsx'
): Record<string, string> => {
  const source = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const imports: { names: string[]; from: string; type: boolean }[] = []
  const declarations = new Map<string, string>()
  const stories = new Map<string, ts.ObjectLiteralExpression>()
  let meta: ts.ObjectLiteralExpression | undefined

  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause
      const from = (statement.moduleSpecifier as ts.StringLiteral).text
      const names: string[] = []
      if (clause?.name) names.push(clause.name.text)
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings))
        for (const el of clause.namedBindings.elements)
          names.push(el.isTypeOnly ? `type ${el.name.text}` : el.name.text)
      imports.push({ names, from, type: !!clause?.isTypeOnly })
    } else if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) continue
        const name = d.name.text
        const exported = statement.modifiers?.some(
          (m) => m.kind === ts.SyntaxKind.ExportKeyword
        )
        const object = objectOf(d.initializer)
        if (name === 'meta' && object) meta = object
        else if (exported && object && /^Story/.test(d.type?.getText(source) ?? ''))
          stories.set(name, object)
        else if (!exported || !d.type)
          declarations.set(name, `const ${d.getText(source)}`)
      }
    } else if (
      (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
      statement.name
    ) {
      declarations.set(
        statement.name.text,
        statement.getText(source).replace(/^export\s+/, '')
      )
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      declarations.set(
        statement.name.text,
        statement.getText(source).replace(/^export\s+/, '')
      )
    }
  }

  const out: Record<string, string> = {}
  const metaRender = meta && property(meta, 'render')
  for (const [name, story] of stories) {
    const render = property(story, 'render') ?? metaRender
    // No render: the meta's component, when the file defines it (a recipe's
    // own form), stands for one.
    const own = meta && property(meta, 'component')
    const local =
      !render &&
      own &&
      ts.isPropertyAssignment(own) &&
      declarations.has(own.initializer.getText(source))
        ? own.initializer.getText(source)
        : undefined
    const fn = render
      ? ts.isPropertyAssignment(render)
        ? render.initializer
        : render
      : local
        ? (
            ts.createSourceFile(
              'x.tsx',
              `const f = () => <${local} />`,
              ts.ScriptTarget.Latest,
              true,
              ts.ScriptKind.TSX
            ).statements[0] as ts.VariableStatement
          ).declarationList.declarations[0]!.initializer!
        : undefined
    if (!fn) continue
    const text = fn.getText()
    const first = ts.isFunctionLike(fn) ? fn.parameters[0] : undefined
    // The args, by the name the render gives them (or the pattern it unpacks).
    const param =
      first && !first.name.getText().startsWith('_') ? first.name.getText() : undefined
    const readsArgs = param !== undefined
    const component = asComponent(name, fn, param)
    if (!component) continue

    // What it needs from the module, and what that needs in turn.
    const argNodes = [meta && property(meta, 'args'), property(story, 'args')].map((p) =>
      p && ts.isPropertyAssignment(p) ? p.initializer : undefined
    )
    const argText = argNodes.map((n) => n?.getText(source) ?? '{}')
    const needed = new Set<string>()
    const queue = [text, ...(readsArgs ? argText : [])]
    while (queue.length) {
      for (const id of used(queue.pop()!)) {
        if (needed.has(id) || !declarations.has(id) || id === name) continue
        needed.add(id)
        queue.push(declarations.get(id)!)
      }
    }
    const helperText = [...needed].map((n) => declarations.get(n)!)
    // Only where state is: in the render, or in a component it shows.
    if (!STATEFUL.test([text, ...helperText].join('\n'))) continue
    const all = [text, ...helperText, ...(readsArgs ? argText : [])].join('\n')
    const names = used(all)
    const lines = imports
      .filter(
        (i) => !i.from.startsWith('@storybook/') && !i.from.startsWith('storybook/')
      )
      .map((i) => ({
        ...i,
        names: i.names.filter((n) => names.has(n.replace(/^type /, ''))),
      }))
      .filter((i) => i.names.length)
      .map(
        (i) => `import ${i.type ? 'type ' : ''}{ ${i.names.join(', ')} } from '${i.from}'`
      )
    const helpers = [...declarations.keys()]
      .filter((n) => needed.has(n))
      .map((n) => declarations.get(n)!)
    out[name] = [
      lines.join('\n'),
      ...helpers,
      component.replace('{ ...metaArgs, ...storyArgs }', literal(argNodes, source)),
    ]
      .filter(Boolean)
      .join('\n\n')
  }
  return out
}

/**
 * The function-valued args of the meta and each story, as written:
 * `{ 'meta.args.onAction': "() => toast({ … })" }`, keyed by the expression
 * that reaches the function at runtime.
 */
export const functionArgs = (
  code: string,
  fileName = 'story.tsx'
): Record<string, string> => {
  const source = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const out: Record<string, string> = {}
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const d of statement.declarationList.declarations) {
      if (!ts.isIdentifier(d.name)) continue
      const args = objectOf(d.initializer) && property(objectOf(d.initializer)!, 'args')
      const object =
        args && ts.isPropertyAssignment(args) ? objectOf(args.initializer) : undefined
      for (const p of object?.properties ?? [])
        if (
          ts.isPropertyAssignment(p) &&
          (ts.isArrowFunction(p.initializer) || ts.isFunctionExpression(p.initializer))
        )
          out[`${d.name.text}.args.${p.name.getText(source)}`] = dedent(
            p.initializer.getText(source)
          )
    }
  }
  return out
}

/**
 * Code that tags each function arg with its source, under
 * `Symbol.for('greese.source')`, for "Show code" to print instead of
 * `() => {}`.
 */
export const functionArgTags = (args: Record<string, string>): string =>
  Object.entries(args)
    .map(
      ([path, text]) => `${path}[Symbol.for('greese.source')] = ${JSON.stringify(text)}`
    )
    .join('\n')

/** Code that sets each snippet as its story's `parameters.docs.source.code`. */
export const sourceAssignments = (sources: Record<string, string>): string =>
  Object.entries(sources)
    .map(
      ([name, snippet]) =>
        `${name}.parameters = { ...${name}.parameters, docs: { ...${name}.parameters?.docs, source: { ...${name}.parameters?.docs?.source, code: ${JSON.stringify(snippet)} } } }`
    )
    .join('\n')

const STORY_FILE = /\/apps\/docs\/stories\/.+\.stories\.tsx$/

/** Adds the snippets to every story file, as Storybook and the web app load it. */
export const storySourcePlugin = () => ({
  name: 'greese-story-source',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (id.includes('?') || !STORY_FILE.test(id)) return
    const assignments = [
      sourceAssignments(storySources(code, id)),
      functionArgTags(functionArgs(code, id)),
    ]
      .filter(Boolean)
      .join('\n')
    return assignments ? { code: `${code}\n${assignments}\n`, map: null } : undefined
  },
})
