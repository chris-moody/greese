import { blockOf, blocks } from '../manifest.ts'
import type { Picked } from '../protocol.ts'

/** The nearest element (itself included) that carries a component class. */
const componentElement = (target: EventTarget | null): HTMLElement | undefined => {
  let el = target instanceof Element ? target : null
  while (el) {
    if (el instanceof HTMLElement && [...el.classList].some((c) => blockOf(c))) return el
    el = el.parentElement
  }
  return undefined
}

export const pick = (
  target: EventTarget | null
): (Picked & { el: HTMLElement }) | undefined => {
  const el = componentElement(target)
  if (!el) return undefined
  const classes = [...el.classList].filter((c) => c.startsWith('greese-'))
  // A part's class names its block too (greese-Button-icon): prefer the root.
  const block =
    classes.map(blockOf).find((b, i) => b && classes[i] === `greese-${b}`) ??
    classes.map(blockOf).find(Boolean)!
  const style = getComputedStyle(el)
  const variables = Object.fromEntries(
    blocks[block]!.variables.map((v) => [
      v,
      style.getPropertyValue(v).replace(/\s+/g, ' ').trim(),
    ])
  )
  return { el, block, classes, variables }
}

/**
 * Inspect mode: hovering outlines the component under the pointer, a click
 * picks it instead of activating it.
 */
export const inspector = (onPick: (picked: Picked) => void) => {
  const box = document.createElement('div')
  box.className = 'studio-inspect-box'
  const label = document.createElement('span')
  box.append(label)
  let on = false

  const move = (event: PointerEvent) => {
    const found = pick(event.target)
    if (!found) return void (box.hidden = true)
    const r = found.el.getBoundingClientRect()
    Object.assign(box.style, {
      top: `${r.top}px`,
      left: `${r.left}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
    })
    label.textContent = found.classes.join(' ')
    box.hidden = false
  }
  const click = (event: MouseEvent) => {
    const found = pick(event.target)
    if (!found) return
    event.preventDefault()
    event.stopPropagation()
    const { el: _el, ...picked } = found
    onPick(picked)
  }

  return (next: boolean) => {
    if (next === on) return
    on = next
    box.hidden = true
    if (on) {
      document.body.append(box)
      document.addEventListener('pointermove', move, true)
      document.addEventListener('click', click, true)
    } else {
      box.remove()
      document.removeEventListener('pointermove', move, true)
      document.removeEventListener('click', click, true)
    }
  }
}
