/**
 * The library's styles the homepage's first screen uses, as render-blocking
 * CSS: the tokens (core.css), each block its prerendered HTML has and the
 * blocks those depend on (a Switch's label is ChoiceGroup's and Field's), in
 * the library's own order. About half of the whole stylesheet; the rest arrives
 * without blocking the first paint (library.ts).
 *
 * The build checks it (server/prerender.ts): a block in the prerendered HTML,
 * or one it depends on, that's missing here fails it. Popover isn't in that HTML: the desktop
 * header's menu (HomeMenu) renders it once hydrated, before library.ts may
 * have arrived.
 */
import '@greese/ui/css/core.css'
import '@greese/ui/css/VisuallyHidden.css'
import '@greese/ui/css/Box.css'
import '@greese/ui/css/Stack.css'
import '@greese/ui/css/Grid.css'
import '@greese/ui/css/Container.css'
import '@greese/ui/css/Visibility.css'
import '@greese/ui/css/Button.css'
import '@greese/ui/css/IconButton.css'
import '@greese/ui/css/Field.css'
import '@greese/ui/css/Select.css'
import '@greese/ui/css/ChoiceGroup.css'
import '@greese/ui/css/Checkbox.css'
import '@greese/ui/css/Switch.css'
import '@greese/ui/css/Text.css'
import '@greese/ui/css/Heading.css'
import '@greese/ui/css/Type.css'
import '@greese/ui/css/Link.css'
import '@greese/ui/css/Code.css'
import '@greese/ui/css/Card.css'
import '@greese/ui/css/Icon.css'
import '@greese/ui/css/Avatar.css'
import '@greese/ui/css/Badge.css'
import '@greese/ui/css/Progress.css'
import '@greese/ui/css/Dialog.css'
import '@greese/ui/css/Popover.css'
import '@greese/ui/css/Toast.css'
import '@greese/ui/css/Header.css'
import '@greese/ui/css/ScrollSpy.css'
import '@greese/ui/css/SegmentedControl.css'
import '@greese/ui/css/Key.css'
import '@greese/ui/css/Motion.css'
