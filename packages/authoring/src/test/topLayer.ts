/**
 * jsdom has neither <dialog> methods nor the Popover API. This models just
 * their state and events, enough for unit tests of wiring and ARIA; real
 * behaviour (focus trap, light dismiss, top layer) is covered by e2e.
 */
const OPEN = Symbol('popoverOpen')
type PopoverEl = HTMLElement & { [OPEN]?: boolean }

const fireToggle = (el: HTMLElement, newState: 'open' | 'closed') => {
  const event = new Event('toggle') as Event & { newState: string; oldState: string }
  event.newState = newState
  event.oldState = newState === 'open' ? 'closed' : 'open'
  el.dispatchEvent(event)
}

export const installTopLayer = (): void => {
  const dialog = HTMLDialogElement.prototype
  dialog.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  dialog.show ??= dialog.showModal
  dialog.close ??= function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }

  const el = HTMLElement.prototype as PopoverEl
  el.showPopover ??= function (this: PopoverEl) {
    if (this[OPEN]) return
    this[OPEN] = true
    this.setAttribute('data-test-popover-open', '')
    fireToggle(this, 'open')
  }
  el.hidePopover ??= function (this: PopoverEl) {
    if (!this[OPEN]) return
    this[OPEN] = false
    this.removeAttribute('data-test-popover-open')
    fireToggle(this, 'closed')
  }

  // jsdom's UA sheet hides every [popover] (and ranks its rule above ours by
  // specificity, ignoring origin); show open ones, as browsers do, so
  // they are focusable and get accessible names.
  const style = document.createElement('style')
  style.textContent = '[popover][data-test-popover-open] { display: block !important; }'
  document.head.append(style)
  el.togglePopover ??= function (this: PopoverEl) {
    if (this[OPEN]) this.hidePopover()
    else this.showPopover()
    return Boolean(this[OPEN])
  }

  // :popover-open is unknown to jsdom's selector engine.
  const matches = Element.prototype.matches
  Element.prototype.matches = function (this: PopoverEl, selector: string) {
    if (selector === ':popover-open') return Boolean(this[OPEN])
    return matches.call(this, selector)
  } as typeof Element.prototype.matches

  // Clicking a popovertarget button toggles its popover, as browsers do.
  document.addEventListener('click', (event) => {
    const invoker = (event.target as Element).closest?.('[popovertarget]')
    const target =
      invoker && document.getElementById(invoker.getAttribute('popovertarget')!)
    if (target) (target as PopoverEl).togglePopover()
  })
}
