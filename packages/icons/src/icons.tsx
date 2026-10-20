import { createIcon } from './createIcon.tsx'

/*
 * 16 × 16 line icons. Each is its own export, so bundlers keep only the ones
 * you import (the PURE marks tell bundlers the calls have no side effects).
 * Paths are drawn for a 1.75 stroke with round caps and joins.
 */

export const ArrowRightIcon = /* @__PURE__ */ createIcon(
  'ArrowRight',
  'M3 8h10|M9 4l4 4-4 4'
)
export const BellIcon = /* @__PURE__ */ createIcon(
  'Bell',
  'M4 11V7a4 4 0 0 1 8 0v4l1.5 1.5h-11z|M6.5 14h3'
)
export const CheckIcon = /* @__PURE__ */ createIcon('Check', 'M3.5 8.5l3 3 6-7')
export const ChevronDownIcon = /* @__PURE__ */ createIcon('ChevronDown', 'M4 6l4 4 4-4')
export const ChevronRightIcon = /* @__PURE__ */ createIcon('ChevronRight', 'M6 4l4 4-4 4')
export const CloseIcon = /* @__PURE__ */ createIcon('Close', 'M4 4l8 8|M12 4l-8 8')
export const DocumentIcon = /* @__PURE__ */ createIcon(
  'Document',
  'M4 1.5h5l3 3V14.5H4z|M9 1.5v3h3|M6 8h4|M6 11h4'
)
export const FolderIcon = /* @__PURE__ */ createIcon(
  'Folder',
  'M1.5 4h4.5l1.5 1.5h7v8h-13z'
)
export const HeartIcon = /* @__PURE__ */ createIcon(
  'Heart',
  'M8 13.5S2 10 2 5.75A2.75 2.75 0 0 1 8 4.5a2.75 2.75 0 0 1 6 1.25C14 10 8 13.5 8 13.5z'
)
export const HomeIcon = /* @__PURE__ */ createIcon(
  'Home',
  'M2.5 7.5L8 3l5.5 4.5|M4 6.5V13h8V6.5'
)
export const InfoIcon = /* @__PURE__ */ createIcon(
  'Info',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M8 7.5V11|M8 5h.01'
)
export const MenuIcon = /* @__PURE__ */ createIcon(
  'Menu',
  'M2.5 4h11|M2.5 8h11|M2.5 12h11'
)
export const MoonIcon = /* @__PURE__ */ createIcon(
  'Moon',
  'M13.5 9.5A5.5 5.5 0 1 1 6.5 2.5a4.5 4.5 0 0 0 7 7z'
)
export const PlusIcon = /* @__PURE__ */ createIcon('Plus', 'M8 3v10|M3 8h10')
export const SearchIcon = /* @__PURE__ */ createIcon(
  'Search',
  'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10z|M14 14l-3.5-3.5'
)
export const StarIcon = /* @__PURE__ */ createIcon(
  'Star',
  'M8 2l1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3 4.3 13.3l.8-4.1L2 6.3l4.2-.5z'
)
export const SunIcon = /* @__PURE__ */ createIcon(
  'Sun',
  'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M8 1v1.5|M8 13.5V15|M1 8h1.5|M13.5 8H15|M3 3l1 1|M12 12l1 1|M3 13l1-1|M12 4l1-1'
)
export const TrashIcon = /* @__PURE__ */ createIcon(
  'Trash',
  'M3 4.5h10|M6.5 4.5V3h3v1.5|M4.5 4.5l.6 8.5h5.8l.6-8.5'
)
export const UserIcon = /* @__PURE__ */ createIcon(
  'User',
  'M8 8a2.75 2.75 0 1 0 0-5.5A2.75 2.75 0 0 0 8 8z|M2.5 14a5.5 5.5 0 0 1 11 0'
)
