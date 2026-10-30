import { createIcon } from './createIcon.tsx'

/*
 * Line icons, 16 × 16 unless a call says otherwise (`viewBox`). Each is its own
 * export, so bundlers keep only the ones you import (the PURE marks tell
 * bundlers the calls have no side effects). Paths are drawn for a 1.75 stroke
 * with round caps and joins, or the stroke a call names. Sorted by name.
 *
 * Every icon greese ui or its apps draw lives here: add one to this file rather
 * than inlining an `<svg>` or writing a one-off component (ADR 0020).
 */

export const AccessibilityIcon = /* @__PURE__ */ createIcon(
  'Accessibility',
  'M10.4 5a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0|M5 9h14M12 9v5l-3 6M12 14l3 6',
  { viewBox: 24, strokeWidth: 1.8 }
)
export const ArchiveIcon = /* @__PURE__ */ createIcon(
  'Archive',
  'M2 3h12v3H2z|M3 6v7.5h10V6|M6.5 8.5h3'
)
export const ArrowRightIcon = /* @__PURE__ */ createIcon(
  'ArrowRight',
  'M3 8h10|M9 4l4 4-4 4'
)
export const BellIcon = /* @__PURE__ */ createIcon(
  'Bell',
  'M4 11V7a4 4 0 0 1 8 0v4l1.5 1.5h-11z|M6.5 14h3'
)
export const CartIcon = /* @__PURE__ */ createIcon(
  'Cart',
  'M1.5 2h2l1.6 8h7.4l1.5-5.5H4.3|M6.5 13.5h.01|M11.5 13.5h.01'
)
export const CheckIcon = /* @__PURE__ */ createIcon('Check', 'M3.5 8.5l3 3 6-7')
export const CheckDashIcon = /* @__PURE__ */ createIcon(
  'CheckDash',
  'M3.5 8.5l3 3 6-7|M4 8h8'
)
export const ChevronDownIcon = /* @__PURE__ */ createIcon('ChevronDown', 'M4 6l4 4 4-4')
export const ChevronLeftIcon = /* @__PURE__ */ createIcon(
  'ChevronLeft',
  'M10 3.5L5.5 8l4.5 4.5'
)
export const ChevronRightIcon = /* @__PURE__ */ createIcon('ChevronRight', 'M6 4l4 4-4 4')
export const CloseIcon = /* @__PURE__ */ createIcon('Close', 'M4 4l8 8|M12 4l-8 8')
/** A circle split down the middle: following the system's light or dark. */
export const ContrastIcon = /* @__PURE__ */ createIcon(
  'Contrast',
  'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2z|M8 2v12|M8 4.5h3.5|M8 7h5|M8 9.5h5|M8 12h3.5'
)
export const CopyIcon = /* @__PURE__ */ createIcon(
  'Copy',
  'M10 8h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2z|M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2',
  { viewBox: 24, strokeWidth: 1.8 }
)
export const DocumentIcon = /* @__PURE__ */ createIcon(
  'Document',
  'M4 1.5h5l3 3V14.5H4z|M9 1.5v3h3|M6 8h4|M6 11h4'
)
export const DotsIcon = /* @__PURE__ */ createIcon(
  'Dots',
  'M5 12h.01M12 12h.01M19 12h.01',
  { viewBox: 24, strokeWidth: 1.8 }
)
export const FeatherIcon = /* @__PURE__ */ createIcon(
  'Feather',
  'M15.5 0.5c-8.4 3.3-12 4.3-12 11.3l-3.2 3.5 M3.6 12.4 c5 0 9-3 12-12 M3.7 11.6 c0.5 1 2-5 8-7 M7 8 L 8 4',
  { viewBox: 24, strokeWidth: 1.8 }
)
export const FolderIcon = /* @__PURE__ */ createIcon(
  'Folder',
  'M1.5 4h4.5l1.5 1.5h7v8h-13z'
)
export const GithubIcon = /* @__PURE__ */ createIcon(
  'Github',
  'M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6.2 0C6.6 2.8 5.6 3.1 5.6 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.2 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21',
  { viewBox: 24, strokeWidth: 1.8 }
)
export const HeartIcon = /* @__PURE__ */ createIcon(
  'Heart',
  'M8 13.5S2 10 2 5.75A2.75 2.75 0 0 1 8 4.5a2.75 2.75 0 0 1 6 1.25C14 10 8 13.5 8 13.5z'
)
export const HomeIcon = /* @__PURE__ */ createIcon(
  'Home',
  'M2.5 7.5L8 3l5.5 4.5|M4 6.5V13h8V6.5'
)
export const ImportIcon = /* @__PURE__ */ createIcon(
  'Import',
  'M8 2v8|M5 7l3 3 3-3|M2.5 11v2.5h11V11'
)
export const InboxIcon = /* @__PURE__ */ createIcon(
  'Inbox',
  'M2 9.5l2-6h8l2 6v4H2z|M2 9.5h3.5l1 1.5h3l1-1.5H14'
)
export const InfoIcon = /* @__PURE__ */ createIcon(
  'Info',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M8 7.5V11|M8 5h.01'
)
// Lines of text inside a magnifier's lens: inspecting what's on the page.
export const InspectIcon = /* @__PURE__ */ createIcon(
  'Inspect',
  'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10z|M14 14l-3.5-3.5|M4.25 4.5h5|M3.25 7h7|M4.25 9.5h5'
)
export const LayersIcon = /* @__PURE__ */ createIcon(
  'Layers',
  'm12 3 9 5-9 5-9-5 9-5Z|m3 13 9 5 9-5',
  { viewBox: 24, strokeWidth: 1.8 }
)
export const MenuIcon = /* @__PURE__ */ createIcon(
  'Menu',
  'M2.5 4h11|M2.5 8h11|M2.5 12h11'
)
export const MinusIcon = /* @__PURE__ */ createIcon('Minus', 'M3 8h10')
export const MoonIcon = /* @__PURE__ */ createIcon(
  'Moon',
  'M13.5 9.5A5.5 5.5 0 1 1 6.5 2.5a4.5 4.5 0 0 0 7 7z'
)
export const MotionIcon = /* @__PURE__ */ createIcon(
  'Motion',
  'M4 17c3 0 4-10 8-10s5 10 8 10|M4 21h16',
  { viewBox: 24, strokeWidth: 1.8 }
)
export const PhoneIcon = /* @__PURE__ */ createIcon(
  'Phone',
  'M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z|M11 18h2',
  { viewBox: 24, strokeWidth: 1.8 }
)
export const PlusIcon = /* @__PURE__ */ createIcon('Plus', 'M8 3v10|M3 8h10')
export const ReplayIcon = /* @__PURE__ */ createIcon(
  'Replay',
  'M3 12a9 9 0 1 0 3-6.7L3 8|M3 3v5h5',
  { viewBox: 24, strokeWidth: 1.8 }
)
export const SaveIcon = /* @__PURE__ */ createIcon(
  'Save',
  'M2.5 2.5h9l2 2v9h-11z|M5 2.5v3.5h5V2.5|M5 13.5v-4h6v4'
)
export const SearchIcon = /* @__PURE__ */ createIcon(
  'Search',
  'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10z|M14 14l-3.5-3.5'
)
export const SendIcon = /* @__PURE__ */ createIcon(
  'Send',
  'M14 2L7 9|M14 2l-4.5 12-2-5-5-2z'
)
export const ServerIcon = /* @__PURE__ */ createIcon(
  'Server',
  'M5.5 4h13a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1 -1.5 1.5h-13a1.5 1.5 0 0 1 -1.5 -1.5v-3a1.5 1.5 0 0 1 1.5 -1.5z|M5.5 14h13a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1 -1.5 1.5h-13a1.5 1.5 0 0 1 -1.5 -1.5v-3a1.5 1.5 0 0 1 1.5 -1.5z|M8 7h.01M8 17h.01',
  { viewBox: 24, strokeWidth: 1.8 }
)
// Shape themes: a circle and a square side by side over a triangle, outlined,
// or solid when one is chosen.
export const ShapesIcon = /* @__PURE__ */ createIcon(
  'Shapes',
  'M4.375 8.125a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7z|M8.125 1.125h7v7h-7z|M3.75 15l3.5-7 3.5 7z'
)
// The same shapes solid, each a quarter unit inside the outline's line rather
// than out to its stroke: grown to the stroke, they'd run into one another.
export const ShapesFilledIcon = /* @__PURE__ */ createIcon(
  'ShapesFilled',
  'M4.375 7.875a3.25 3.25 0 1 0 0-6.5a3.25 3.25 0 1 0 0 6.5z|M8.375 1.375h6.5v6.5h-6.5z|M4.16 14.75l3.09-6.19 3.09 6.19z',
  { filled: true }
)
export const SlidersIcon = /* @__PURE__ */ createIcon(
  'Sliders',
  'M2.5 4.5h11|M2.5 11.5h11|M10 3v3|M6 10v3'
)
export const SortIcon = /* @__PURE__ */ createIcon(
  'Sort',
  'M5 6.5L8 3.5l3 3|M5 9.5l3 3 3-3'
)
// Motion themes: a ball with speed lines, outlined, or solid when one is chosen.
export const SpeedIcon = /* @__PURE__ */ createIcon(
  'Speed',
  'M11 11.25a3.25 3.25 0 1 0 0-6.5a3.25 3.25 0 1 0 0 6.5z|M1.5 5.5h4|M1 8h3.5|M1.5 10.5h4'
)
export const SpeedFilledIcon = /* @__PURE__ */ createIcon(
  'SpeedFilled',
  'M11 11.75a3.75 3.75 0 1 0 0-7.5a3.75 3.75 0 1 0 0 7.5z|M1.5 4.75h4v1.5h-4z|M1 7.25h3.5v1.5H1z|M1.5 9.75h4v1.5h-4z',
  { filled: true }
)
export const StarIcon = /* @__PURE__ */ createIcon(
  'Star',
  'M8 2l1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3 4.3 13.3l.8-4.1L2 6.3l4.2-.5z'
)
export const StarFilledIcon = /* @__PURE__ */ createIcon(
  'StarFilled',
  'M12 2.5l2.94 6.08 6.56.82-4.83 4.6 1.22 6.5L12 17.27 6.11 20.5l1.22-6.5-4.83-4.6 6.56-.82z',
  { viewBox: 24, filled: true }
)
export const SunIcon = /* @__PURE__ */ createIcon(
  'Sun',
  'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M8 1v1.5|M8 13.5V15|M1 8h1.5|M13.5 8H15|M3 3l1 1|M12 12l1 1|M3 13l1-1|M12 4l1-1'
)
export const TrashIcon = /* @__PURE__ */ createIcon(
  'Trash',
  'M3 4.5h10|M6.5 4.5V3h3v1.5|M4.5 4.5l.6 8.5h5.8l.6-8.5'
)
export const TrendDownIcon = /* @__PURE__ */ createIcon(
  'TrendDown',
  'M2 5l4 4 3-3 5 5|M10 11h4V7'
)
export const TrendUpIcon = /* @__PURE__ */ createIcon(
  'TrendUp',
  'M2 11l4-4 3 3 5-5|M10 5h4v4'
)
export const UserIcon = /* @__PURE__ */ createIcon(
  'User',
  'M8 8a2.75 2.75 0 1 0 0-5.5A2.75 2.75 0 0 0 8 8z|M2.5 14a5.5 5.5 0 0 1 11 0'
)
