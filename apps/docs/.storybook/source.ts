/**
 * Cleans the "Show code" snippets Storybook generates from story args.
 *
 * A story that passes several children through `args` writes them as a
 * fragment (`children: <>…</>`), and Storybook prints that fragment
 * literally, as `<React.Fragment key=".0">`. Components never need it:
 * `<Accordion><AccordionItem />…</Accordion>` is the real usage. So the
 * wrapper lines are dropped and what they held is outdented one level.
 */
const OPEN =
  /^(\s*)<(?:React\.Fragment(?:\s+key="[^"]*")?|Fragment(?:\s+key="[^"]*")?|)>$/
const CLOSE = /^(\s*)<\/(?:React\.Fragment|Fragment|)>$/

export const unwrapFragments = (code: string): string => {
  const out: string[] = []
  // Indents of the wrappers being removed, innermost last.
  const open: string[] = []
  for (const line of code.split('\n')) {
    const opening = OPEN.exec(line)
    if (opening) {
      open.push(opening[1]!)
      continue
    }
    const closing = CLOSE.exec(line)
    if (closing && open.at(-1) === closing[1]) {
      open.pop()
      continue
    }
    // Two spaces per removed wrapper, which is how Storybook indents.
    const outdent = open.length * 2
    out.push(
      line.startsWith(' '.repeat(outdent)) ? line.slice(outdent) : line.trimStart()
    )
  }
  return out.join('\n')
}
