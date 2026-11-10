import { createIcon } from './createIcon.tsx'

/*
 * Line icons, 16 × 16 unless a call says otherwise (`viewBox`). Each is its own
 * export, so bundlers keep only the ones you import (the PURE marks tell
 * bundlers the calls have no side effects). Paths are drawn for a 1.5 stroke
 * with round caps and joins, or the stroke a call names. Sorted by name.
 *
 * Every icon greese ui or its apps draw lives here: add one to this file rather
 * than inlining an `<svg>` or writing a one-off component (ADR 0020).
 */

export const AccessibilityIcon = /* @__PURE__ */ createIcon(
  'Accessibility',
  'M6.933 3.333a1.067 1.067 0 1 0 2.133 0a1.067 1.067 0 1 0 -2.133 0|M3.333 6h9.333M8 6v3.333l-2 4M8 9.333l2 4'
)
export const AlertCircleIcon = /* @__PURE__ */ createIcon(
  'AlertCircle',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M8 5v4|M8 11.4h.01'
)
export const AlignCenterIcon = /* @__PURE__ */ createIcon(
  'AlignCenter',
  'M2.5 4h11|M4.5 8h7|M3.5 12h9'
)
export const AlignJustifyIcon = /* @__PURE__ */ createIcon(
  'AlignJustify',
  'M2.5 3.5h11|M2.5 6.5h11|M2.5 9.5h11|M2.5 12.5h11'
)
export const AlignLeftIcon = /* @__PURE__ */ createIcon(
  'AlignLeft',
  'M2.5 4h11|M2.5 8h7|M2.5 12h9'
)
export const AlignRightIcon = /* @__PURE__ */ createIcon(
  'AlignRight',
  'M2.5 4h11|M6.5 8h7|M4.5 12h9'
)
export const AnchorIcon = /* @__PURE__ */ createIcon(
  'Anchor',
  'M8 4.918a1.75 1.75 0 1 0 0 -3.5a1.75 1.75 0 0 0 0 3.5z|M8 4.918V13.418|M5.5 7.418h5|M2.5 8.918a5.5 5.5 0 0 0 11 0'
)
export const ArchiveIcon = /* @__PURE__ */ createIcon(
  'Archive',
  'M2 3h12v3H2z|M3 6v7.5h10V6|M6.5 8.5h3'
)
export const ArrowDownIcon = /* @__PURE__ */ createIcon(
  'ArrowDown',
  'M8 3v10|M4 9l4 4 4-4'
)
export const ArrowLeftIcon = /* @__PURE__ */ createIcon(
  'ArrowLeft',
  'M13 8H3|M7 4L3 8l4 4'
)
export const ArrowRightIcon = /* @__PURE__ */ createIcon(
  'ArrowRight',
  'M3 8h10|M9 4l4 4-4 4'
)
export const ArrowUpIcon = /* @__PURE__ */ createIcon('ArrowUp', 'M8 13V3|M4 7l4-4 4 4')
export const BarChartIcon = /* @__PURE__ */ createIcon(
  'BarChart',
  'M2.5 13.5h11|M4.5 13.5V9|M8 13.5V5|M11.5 13.5V7'
)
export const BellIcon = /* @__PURE__ */ createIcon(
  'Bell',
  'M4 11V7a4 4 0 0 1 8 0v4l1.5 1.5h-11z|M6.5 14h3'
)
export const BlockIcon = /* @__PURE__ */ createIcon(
  'Block',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M3.8 12.2L12.2 3.8'
)
export const BoxingIcon = /* @__PURE__ */ createIcon(
  'Boxing',
  'M4.758 6.078A3 3 0 0 1 7.39 1.944H9.867A3.5 3.5 0 0 1 13.367 6.125V8.125A2 2 0 0 1 11.367 10.125H3.559A2 2 0 0 1 4.787 6.052Z|M4.799 10.229v2.5A1.5 1.5 0 0 0 6.299 14.229h4a1.5 1.5 0 0 0 1.5 -1.5V10.229'
)
export const BracesIcon = /* @__PURE__ */ createIcon(
  'Braces',
  'M6 2.5H5A1.5 1.5 0 0 0 3.5 4v2.5L2.5 8l1 1.5V12A1.5 1.5 0 0 0 5 13.5h1|M10 2.5h1A1.5 1.5 0 0 1 12.5 4v2.5L13.5 8l-1 1.5V12A1.5 1.5 0 0 1 11 13.5h-1'
)
export const BracketsIcon = /* @__PURE__ */ createIcon(
  'Brackets',
  'M6 2.5H3.5v11H6|M10 2.5h2.5v11H10'
)
export const BrainIcon = /* @__PURE__ */ createIcon(
  'Brain',
  'M8 4.2v9.6|M8 4.2A2 2 0 0 0 4.6 3 2 2 0 0 0 3.2 5.8 2 2 0 0 0 2.6 9.3 2 2 0 0 0 5 12.8a2 2 0 0 0 3 1|M8 4.2A2 2 0 0 1 11.4 3a2 2 0 0 1 1.4 2.8 2 2 0 0 1 .6 3.5 2 2 0 0 1-2.4 3.5 2 2 0 0 1-3 1'
)
export const BrushIcon = /* @__PURE__ */ createIcon(
  'Brush',
  'M13.048 1.122l1.883 1.883l-6.474 6.474l-1.883 -1.883z|M2.158 13.007C2.465 11.661 2.529 10.505 3.013 10.021A1.752 1.713 -135 0 1 6.007 12.931C5.512 13.547 4.772 14.667 1.08 14.664Z'
)
export const BugIcon = /* @__PURE__ */ createIcon(
  'Bug',
  'M8 13.5a4 4 0 0 0 4-4V7H4v2.5a4 4 0 0 0 4 4z|M5.5 7a2.5 2.5 0 0 1 5 0|M6 4.3l-.8-1.3|M10 4.3l.8-1.3|M4 8.5H1.8|M12 8.5h2.2|M4.3 11L2.2 12.4|M11.7 11l2.1 1.4'
)
export const CameraIcon = /* @__PURE__ */ createIcon(
  'Camera',
  'M2 5.5h2.5L5.5 4h5l1 1.5H14v8H2z|M8 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'
)
export const CartIcon = /* @__PURE__ */ createIcon(
  'Cart',
  'M1.5 2h2l1.6 8h7.4l1.5 -5.5H4.3|M11.657 12A1 1 0 0 1 11.657 14A1 1 0 0 1 11.657 12Z|M6.38 12A1 1 0 0 1 6.38 14A1 1 0 0 1 6.38 12Z'
)
export const CheckIcon = /* @__PURE__ */ createIcon('Check', 'M3.5 8.5l3 3 6-7')
export const CheckCircleIcon = /* @__PURE__ */ createIcon(
  'CheckCircle',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M5.3 8.3l2 2 3.5-4.3'
)
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
export const ChevronUpIcon = /* @__PURE__ */ createIcon('ChevronUp', 'M4 10l4-4 4 4')
export const ChipIcon = /* @__PURE__ */ createIcon(
  'Chip',
  'M4.5 4.5h7v7h-7z|M6.5 1.5v3|M9.5 1.5v3|M6.5 11.5v3|M9.5 11.5v3|M1.5 6.5h3|M1.5 9.5h3|M11.5 6.5h3|M11.5 9.5h3'
)
export const CircleIcon = /* @__PURE__ */ createIcon(
  'Circle',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z'
)
export const CircleFilledIcon = /* @__PURE__ */ createIcon(
  'CircleFilled',
  'M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3z',
  { filled: true }
)
export const CloseIcon = /* @__PURE__ */ createIcon('Close', 'M4 4l8 8|M12 4l-8 8')
/** A circle split down the middle: following the system's light or dark. */
export const CloseCircleIcon = /* @__PURE__ */ createIcon(
  'CloseCircle',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M6 6l4 4|M10 6l-4 4'
)
export const CodeIcon = /* @__PURE__ */ createIcon(
  'Code',
  'M5.5 4.5L2 8l3.5 3.5|M10.5 4.5L14 8l-3.5 3.5'
)
export const CoinIcon = /* @__PURE__ */ createIcon(
  'Coin',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M8 4.2v7.6|M9.9 6.1a1.9 1.9 0 0 0-1.9-1c-1.1 0-1.9.7-1.9 1.5s.8 1.4 1.9 1.4 1.9.6 1.9 1.4-.8 1.5-1.9 1.5a1.9 1.9 0 0 1-1.9-1'
)
export const ColumnsIcon = /* @__PURE__ */ createIcon(
  'Columns',
  'M2.5 3h11v10h-11z|M6.17 3v10|M9.83 3v10'
)
export const CommitIcon = /* @__PURE__ */ createIcon(
  'Commit',
  'M2 8H5.386|M10.786 8.043H14|M8 10.5a2.5 2.5 0 1 0 0 -5a2.5 2.5 0 0 0 0 5z'
)
export const ContrastIcon = /* @__PURE__ */ createIcon(
  'Contrast',
  'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2z|M8 2v12|M8 4.5h3.5|M8 7h5|M8 9.5h5|M8 12h3.5'
)
export const CopyIcon = /* @__PURE__ */ createIcon(
  'Copy',
  'M6.667 5.333h5.333a1.333 1.333 0 0 1 1.333 1.333v5.333a1.333 1.333 0 0 1 -1.333 1.333h-5.333a1.333 1.333 0 0 1 -1.333 -1.333v-5.333a1.333 1.333 0 0 1 1.333 -1.333z|M10.667 5.333V4a1.333 1.333 0 0 0 -1.333 -1.333H4a1.333 1.333 0 0 0 -1.333 1.333v5.333a1.333 1.333 0 0 0 1.333 1.333h1.333'
)
export const CopyPlusIcon = /* @__PURE__ */ createIcon(
  'CopyPlus',
  'M6.5 6.5h7v7h-7z|M10.024 6.28V2.5H2.5V9.5H6.154|M10 8.5v3|M8.5 10h3'
)
export const DocumentIcon = /* @__PURE__ */ createIcon(
  'Document',
  'M4 1.5h5l3 3V14.5H4z|M9 1.5v3h3|M6 8h4|M6 11h4'
)
export const DotsIcon = /* @__PURE__ */ createIcon(
  'Dots',
  'M3.333 8h0.007M8 8h0.007M12.667 8h0.007'
)
// The Import glyph as it was: an arrow down into a tray.
export const DotsVerticalIcon = /* @__PURE__ */ createIcon(
  'DotsVertical',
  'M8 4h.01|M8 8h.01|M8 12h.01'
)
export const DownloadIcon = /* @__PURE__ */ createIcon(
  'Download',
  'M8 2v8|M5 7l3 3 3-3|M2.5 11v2.5h11V11'
)
export const EarIcon = /* @__PURE__ */ createIcon(
  'Ear',
  'M5.69 6.019A2.5 2.5 0 0 1 10.69 6.019C10.69 7.519 9.49 8.019 8.99 9.019C8.59 9.819 8.833 11.133 7.833 11.133A1.2 1.2 0 0 1 6.49 9.319|M4.198 2.941A4.95 4.568 0 0 1 12.993 4.197C13.572 5.069 13.77 7.934 12.668 8.99C10.322 11.115 12.607 11.511 9.914 13.634C7.498 15.642 3.061 13.162 3.932 9.663'
)
export const ExternalLinkIcon = /* @__PURE__ */ createIcon(
  'ExternalLink',
  'M9.5 2.5h4v4|M13.5 2.5L8.5 7.5|M12 9.5V12a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 12V5.5A1.5 1.5 0 0 1 4 4h2.5'
)
export const EyeIcon = /* @__PURE__ */ createIcon(
  'Eye',
  'M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z|M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'
)
export const EyeOffIcon = /* @__PURE__ */ createIcon(
  'EyeOff',
  'M8 10a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z|M1.5 8S4 3.5 8 3.5S14.5 8 14.5 8S12 12.5 8 12.5S1.5 8 1.5 8z|M2 2l12 12'
)
export const EyedropperIcon = /* @__PURE__ */ createIcon(
  'Eyedropper',
  'M4.853 11.193c0.846 1.181 1.208 1.889 1.208 2.362a1.208 1.181 0 0 1 -2.418 0c0 -0.473 0.363 -1.181 1.208 -2.362z|M11.913 4.088L13.327 1.26L14.741 2.673L11.913 4.088M9.792 1.967L14.034 6.209M11.206 3.38L5.549 9.038L4.842 11.159L6.963 10.452L6.963 10.452L12.62 4.795'
)
export const FaceIcon = /* @__PURE__ */ createIcon(
  'Face',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M6 6.5h.01|M10 6.5h.01|M5.5 10a3.5 3.5 0 0 0 5 0'
)
export const FaceSadIcon = /* @__PURE__ */ createIcon(
  'FaceSad',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M6 6.5h.01|M10 6.5h.01|M10.5 11.5a3.5 3.5 0 0 0-5 0'
)
export const FeatherIcon = /* @__PURE__ */ createIcon(
  'Feather',
  'M13.369 2.517C6.373 3.566 3.834 5.077 5.369 10.05L3.236 12.383M5.436 10.45C10.173 10.746 11.575 10.551 13.436 2.45M5.503 9.917C5.836 10.583 5.153 6.215 11.206 5.011M7.027 6.993L8.174 3.996'
)
export const FilmIcon = /* @__PURE__ */ createIcon(
  'Film',
  'M2 3.5h12v9H2z|M5 3.5v9|M11 3.5v9|M2 6.5h3|M2 9.5h3|M11 6.5h3|M11 9.5h3'
)
export const FireIcon = /* @__PURE__ */ createIcon(
  'Fire',
  'M8 14c2.5 0 4.5-1.8 4.5-4.2 0-3.3-3-4.3-3-7.3-2 1-3 3-3 4.5 0 1-.5 1.5-1 1.5s-1-.5-1-1.5C3.8 8.3 3.5 9 3.5 9.8 3.5 12.2 5.5 14 8 14z'
)
export const FlagIcon = /* @__PURE__ */ createIcon(
  'Flag',
  'M4 2v12|M4 2.5h7.5l-1.6 3 1.6 3H4'
)
export const FlaskIcon = /* @__PURE__ */ createIcon(
  'Flask',
  'M6 2.5h4|M6.5 2.5v4L3.6 12a1.2 1.2 0 0 0 1 2h6.8a1.2 1.2 0 0 0 1-2L9.5 6.5v-4|M5 10h6'
)
export const FocusIcon = /* @__PURE__ */ createIcon(
  'Focus',
  'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z|M2.5 5.5V4a1.5 1.5 0 0 1 1.5-1.5h1.5|M10.5 2.5H12A1.5 1.5 0 0 1 13.5 4v1.5|M13.5 10.5V12a1.5 1.5 0 0 1-1.5 1.5h-1.5|M5.5 13.5H4A1.5 1.5 0 0 1 2.5 12v-1.5'
)
export const FolderIcon = /* @__PURE__ */ createIcon(
  'Folder',
  'M1.5 4h4.5l1.5 1.5h7v8h-13z'
)
// The folder solid, a quarter unit inside the outline's line: a closed folder
// beside FolderIcon's open one in a file tree.
export const FolderFilledIcon = /* @__PURE__ */ createIcon(
  'FolderFilled',
  'M1.75 4.25h4.15l1.5 1.5h6.85v7.5h-12.5z',
  { filled: true }
)
export const FolderOpenIcon = /* @__PURE__ */ createIcon(
  'FolderOpen',
  'M1.5 4h4.5l1.5 1.5h7v2|M1.5 6h14l-1.8 7.5H1.5z'
)
export const FolderPlusIcon = /* @__PURE__ */ createIcon(
  'FolderPlus',
  'M1.5 4h4.5l1.5 1.5h7v8h-13z|M8 7.5v4|M6 9.5h4'
)
export const ForkIcon = /* @__PURE__ */ createIcon(
  'Fork',
  'M7.213 14.703V11.624A2.5 2.5 0 0 1 9.942 9.103H13.396|M10.948 6.597l2.5 2.5L10.948 11.597|M7.213 14.703V1.982|M4.694 4.372l2.5 -2.5L9.694 4.372'
)
export const FullscreenIcon = /* @__PURE__ */ createIcon(
  'Fullscreen',
  'M2.5 6V2.5H6|M10 2.5h3.5V6|M13.5 10v3.5H10|M6 13.5H2.5V10'
)
export const FullscreenExitIcon = /* @__PURE__ */ createIcon(
  'FullscreenExit',
  'M6 2.5V6H2.5|M13.5 6H10V2.5|M10 13.5V10h3.5|M2.5 10H6v3.5'
)
export const GamepadIcon = /* @__PURE__ */ createIcon(
  'Gamepad',
  'M4.514 4.771H11.392A3 3 0 0 1 11.5 11.5A2 2 0 0 1 9.9 10.7L9.5 10H6.5L6.1 10.7A2 2 0 0 1 4.5 11.5A3 3 0 0 1 4.514 4.745Z|M3.656 8.2h1.5|M4.406 7.45v1.5|M11.797 8.161h0.01'
)
export const GavelIcon = /* @__PURE__ */ createIcon(
  'Gavel',
  'M4.959 4.774l4.204 5.797l-2.707 2.344l-4.204 -5.797z|M8.272 8.323L14.535 3.711l-1.677 -2.278l-6.263 4.612|M3.109 14.51h6'
)
export const GiftIcon = /* @__PURE__ */ createIcon(
  'Gift',
  'M2.5 6.5h11v7h-11z|M2.5 6.5V5h11v1.5|M8 5v8.5|M8 5S6.4 2 5 2.6s0 2.4 3 2.4|M8 5s1.6-3 3-2.4 0 2.4-3 2.4'
)
export const GithubIcon = /* @__PURE__ */ createIcon(
  'Github',
  'M6 12.667c-2.667 1 -2.667 -1.333 -4 -1.667M10 14v-2.333c0 -0.667 0.067 -0.933 -0.333 -1.333c1.867 -0.2 3.667 -0.933 3.667 -4a3.067 3.067 0 0 0 -0.867 -2.133a2.8 2.8 0 0 0 -0.067 -2.133s-0.667 -0.2 -2.267 0.867a7.733 7.733 0 0 0 -4.133 0C4.4 1.867 3.733 2.067 3.733 2.067a2.8 2.8 0 0 0 -0.067 2.133A3.067 3.067 0 0 0 2.8 6.333c0 3.067 1.8 3.8 3.667 4c-0.4 0.4 -0.4 0.8 -0.333 1.333V14'
)
export const GlobeIcon = /* @__PURE__ */ createIcon(
  'Globe',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M2.2 8h11.6|M8 2a9 9 0 0 1 0 12 9 9 0 0 1 0-12z'
)
export const GradientIcon = /* @__PURE__ */ createIcon(
  'Gradient',
  'M2.5 2.5h11v11h-11z|M2.5 8h11|M2.5 10.6h11|M2.5 12.6h11'
)
export const GridIcon = /* @__PURE__ */ createIcon(
  'Grid',
  'M2.5 2.5h11v11h-11z|M2.5 6.17h11|M2.5 9.83h11|M6.17 2.5v11|M9.83 2.5v11'
)
export const GridOffIcon = /* @__PURE__ */ createIcon(
  'GridOff',
  'M2.5 2.5h11v11h-11z|M2.5 6.17h11|M2.5 9.83h11|M6.17 2.5v11|M9.83 2.5v11|M1.75 1.75l12.5 12.5'
)
export const GripIcon = /* @__PURE__ */ createIcon(
  'Grip',
  'M6 4h.01|M6 8h.01|M6 12h.01|M10 4h.01|M10 8h.01|M10 12h.01'
)
export const GuidesIcon = /* @__PURE__ */ createIcon(
  'Guides',
  'M1.5 1.5h13v3h-10v10h-3z|M10 4.5v10|M4.5 10h10'
)
export const HandIcon = /* @__PURE__ */ createIcon(
  'Hand',
  'M4.75 9V4.25a1 1 0 0 1 2 0V8|M6.75 7.5V2.75a1 1 0 0 1 2 0V7.5|M8.75 7.5V3.5a1 1 0 0 1 2 0V8|M10.75 8V5.25a1 1 0 0 1 2 0v4.5a4.75 4.75 0 0 1-4.75 4.75h-.5a4 4 0 0 1-3-1.35L2.3 10.4a1 1 0 0 1 1.5-1.3L4.75 10V9'
)
export const HeartIcon = /* @__PURE__ */ createIcon(
  'Heart',
  'M8 13.5S2 10 2 5.75A2.75 2.75 0 0 1 8 4.5a2.75 2.75 0 0 1 6 1.25C14 10 8 13.5 8 13.5z'
)
export const HeartFilledIcon = /* @__PURE__ */ createIcon(
  'HeartFilled',
  'M8 13.5S2 10 2 5.75A2.75 2.75 0 0 1 8 4.5a2.75 2.75 0 0 1 6 1.25C14 10 8 13.5 8 13.5z',
  { filled: true }
)
export const HexagonIcon = /* @__PURE__ */ createIcon(
  'Hexagon',
  'M8 2l5 2.9v6.2L8 14l-5-2.9V4.9z'
)
export const HistoryIcon = /* @__PURE__ */ createIcon(
  'History',
  'M3 8a5 5 0 1 0 5-5 5 5 0 0 0-4.6 3|M2.5 2.5V6H6|M8 5.5V8l2.2 1.3'
)
export const HomeIcon = /* @__PURE__ */ createIcon(
  'Home',
  'M2.5 7.5L8 3l5.5 4.5|M4 6.5V13h8V6.5'
)
// DownloadIcon turned half a turn: an arrow up out of a tray. Also UploadIcon.
export const HourglassIcon = /* @__PURE__ */ createIcon(
  'Hourglass',
  'M4 2.5h8|M4 13.5h8|M5 2.5v2.4L8 8l3-3.1V2.5|M5 13.5v-2.4L8 8l3 3.1v2.4'
)
export const ImageIcon = /* @__PURE__ */ createIcon(
  'Image',
  'M2 3.5h12v9H2z|M5.5 7a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z|M2 11l3.5-3 3 2.5 2.5-2 3 3'
)
export const ImagesIcon = /* @__PURE__ */ createIcon(
  'Images',
  'M5.5 2.5h8v8h-8z|M5.526 5.543H2.283V13.5H10.5V10.655'
)
export const ImportIcon = /* @__PURE__ */ createIcon(
  'Import',
  'M8 14V6|M11 9L8 6 5 9|M13.5 5V2.5h-11V5'
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
export const IntersectIcon = /* @__PURE__ */ createIcon(
  'Intersect',
  'M5.914 11.945a4 4 0 1 0 0 -8a4 4 0 0 0 0 8z|M9.914 11.945a4 4 0 1 0 0 -8a4 4 0 0 0 0 8z'
)
export const ItalicIcon = /* @__PURE__ */ createIcon(
  'Italic',
  'M6.5 2.5h5|M4.5 13.5h5|M9.5 2.5l-3 11'
)
export const LayersIcon = /* @__PURE__ */ createIcon(
  'Layers',
  'm8 2l6 3.333l-6 3.333l-6 -3.333l6 -3.333Z|m2 8.667l6 3.333l6 -3.333'
)
export const LightbulbIcon = /* @__PURE__ */ createIcon(
  'Lightbulb',
  'M8 1.5a4 4 0 0 0-2.4 7.2c.5.4.9 1 .9 1.6v.2h3v-.2c0-.6.4-1.2.9-1.6A4 4 0 0 0 8 1.5z|M6.5 13h3|M7 14.5h2'
)
export const LineChartIcon = /* @__PURE__ */ createIcon(
  'LineChart',
  'M2.5 2.5v11h11|M5 10l2.5-3 2 1.5L13 5'
)
export const LinkIcon = /* @__PURE__ */ createIcon(
  'Link',
  'M6.355 9.863l3.4 -3.4|M8.477 4.406l1 -1a2.4 2.4 0 0 1 3.4 3.4l-1 1|M7.954 11.564l-1 1a2.4 2.4 0 0 1 -3.4 -3.4l1 -1'
)
export const LinkOffIcon = /* @__PURE__ */ createIcon(
  'LinkOff',
  'M8.477 4.406l1 -1a2.4 2.4 0 0 1 3.4 3.4l-1 1|M7.954 11.564l-1 1a2.4 2.4 0 0 1 -3.4 -3.4l1 -1|M2 2l12 12|M6.355 9.863l3.4 -3.4'
)
export const LockIcon = /* @__PURE__ */ createIcon(
  'Lock',
  'M3.5 7h9v6.5h-9z|M5.5 7V5a2.5 2.5 0 0 1 5 0v2'
)
export const LockOpenIcon = /* @__PURE__ */ createIcon(
  'LockOpen',
  'M3.5 7h9v6.5h-9z|M5.5 7V5a2.5 2.5 0 0 1 4.9-.7'
)
export const LogoutIcon = /* @__PURE__ */ createIcon(
  'Logout',
  'M6 2.5H3.5v11H6|M10 5.5l3 2.5-3 2.5|M13 8H6'
)
export const LoopIcon = /* @__PURE__ */ createIcon(
  'Loop',
  'M3 6.5A2.5 2.5 0 0 1 5.5 4H12.966|M11 2.014L13.3 4.014L11 6.014|M13 9.5A2.5 2.5 0 0 1 10.5 12H3.497|M4.971 13.943L2.671 11.943L4.971 9.943'
)
export const MenuIcon = /* @__PURE__ */ createIcon(
  'Menu',
  'M2.5 4h11|M2.5 8h11|M2.5 12h11'
)
export const MinusIcon = /* @__PURE__ */ createIcon('Minus', 'M3 8h10')
export const MinusCircleIcon = /* @__PURE__ */ createIcon(
  'MinusCircle',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M5.5 8h5'
)
export const MinusSquareIcon = /* @__PURE__ */ createIcon(
  'MinusSquare',
  'M2.5 2.5h11v11h-11z|M5.5 8h5'
)
export const MoonIcon = /* @__PURE__ */ createIcon(
  'Moon',
  'M13.5 9.5A5.5 5.5 0 1 1 6.5 2.5a4.5 4.5 0 0 0 7 7z'
)
export const MotionIcon = /* @__PURE__ */ createIcon(
  'Motion',
  'M2.667 11.333c2 0 2.667 -6.667 5.333 -6.667s3.333 6.667 5.333 6.667|M2.667 14h10.667'
)
export const MotorcycleIcon = /* @__PURE__ */ createIcon(
  'Motorcycle',
  'M13.124 12.548a1.954 1.845 0 1 0 0 -3.69a1.954 1.845 0 0 0 0 3.69z|M3.155 12.572a1.954 1.845 0 1 0 0 -3.69a1.954 1.845 0 0 0 0 3.69z|M10.794 7.204L9.105 11.014L7.19 11L4.217 7.199H1.244|M13.042 8.686L9.671 4.309H7.245|M11.386 6.957H8.482L6.006 8.785'
)
export const MountainIcon = /* @__PURE__ */ createIcon(
  'Mountain',
  'M1.5 13h13L9.5 4l-2.3 4L6 6.5z'
)
export const MoveIcon = /* @__PURE__ */ createIcon(
  'Move',
  'M8 2.5v11|M2.5 8h11|M6 4.5L8 2.5l2 2|M6 11.5L8 13.5l2-2|M4.5 6L2.5 8l2 2|M11.5 6l2 2-2 2'
)
export const MusicNoteIcon = /* @__PURE__ */ createIcon(
  'MusicNote',
  'M6 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z|M8 10V2.5l5 1.5'
)
export const NavigateIcon = /* @__PURE__ */ createIcon(
  'Navigate',
  'M13.5 2.5L2.5 7l4.5 1.5L8.5 13z'
)
export const PaintBucketIcon = /* @__PURE__ */ createIcon(
  'PaintBucket',
  'M7.619 3.358L2.21 8.931l5.409 5.573L13.027 8.931z|M13.06 9.409c0.968 1.352 1.383 2.162 1.383 2.703a1.383 1.352 0 0 1 -2.767 0c0 -0.541 0.415 -1.352 1.383 -2.703z|M8.117 7.104A1.005 1.005 0 0 1 8.117 9.114A1.005 1.005 0 0 1 8.117 7.104Z|M1.443 1.196L7.219 7.377'
)
export const PaintBucketOffIcon = /* @__PURE__ */ createIcon(
  'PaintBucketOff',
  'M7.619 3.358L2.21 8.931l5.409 5.573L13.027 8.931z|M13.06 9.409c0.968 1.352 1.383 2.162 1.383 2.703a1.383 1.352 0 0 1 -2.767 0c0 -0.541 0.415 -1.352 1.383 -2.703z|M8.117 7.104A1.005 1.005 0 0 1 8.117 9.114A1.005 1.005 0 0 1 8.117 7.104Z|M1.443 1.196L7.219 7.377|M14.5 1.5l-13 13'
)
export const PaletteIcon = /* @__PURE__ */ createIcon(
  'Palette',
  'M8 2a6 6 0 0 0 0 12c.8 0 1.3-.6 1.3-1.3 0-.7-.5-1.2-.5-1.9s.6-1.3 1.3-1.3h1.6A2.4 2.4 0 0 0 14 7C14 4.2 11.3 2 8 2z|M5 6.6h.01|M8 4.9h.01|M10.8 6.3h.01'
)
export const PartyIcon = /* @__PURE__ */ createIcon(
  'Party',
  'M2.5 13.5l4 -9l5.5 5.5z|M8.053 1.791L7.957 3.287|M13.057 4.64l-1 1|M14.46 8.075H12.96|M11.636 2.427l-1.427 1.765'
)
export const PauseIcon = /* @__PURE__ */ createIcon('Pause', 'M6 3.5v9|M10 3.5v9')
export const PencilIcon = /* @__PURE__ */ createIcon(
  'Pencil',
  'M11.6 2.4l2 2-8.1 8.1-2.5.5.5-2.5z|M10.1 3.9l2 2'
)
export const PhoneIcon = /* @__PURE__ */ createIcon(
  'Phone',
  'M6 2h4a1.333 1.333 0 0 1 1.333 1.333v9.333a1.333 1.333 0 0 1 -1.333 1.333h-4a1.333 1.333 0 0 1 -1.333 -1.333v-9.333a1.333 1.333 0 0 1 1.333 -1.333z|M7.333 12h1.333'
)
export const PianoIcon = /* @__PURE__ */ createIcon(
  'Piano',
  'M2 4h12v8H2z|M2 9h12|M5 4v5|M8 4v5|M11 4v5'
)
export const PinIcon = /* @__PURE__ */ createIcon(
  'Pin',
  'M6 2.5h4v3l1.5 2.5h-7L6 5.5z|M8 8v5.5'
)
export const PinFilledIcon = /* @__PURE__ */ createIcon(
  'PinFilled',
  'M6 2.2h4v3.3l1.6 2.6H8.6v5.7h-1.2V8.1H4.4L6 5.5z',
  { filled: true }
)
export const PlayIcon = /* @__PURE__ */ createIcon('Play', 'M5 3.3l7.4 4.7L5 12.7z')
export const PlayCircleIcon = /* @__PURE__ */ createIcon(
  'PlayCircle',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M6.8 5.6l3.9 2.4-3.9 2.4z'
)
export const PlaylistIcon = /* @__PURE__ */ createIcon(
  'Playlist',
  'M2.5 4h7|M2.5 7.5h7|M2.5 11h4|M11 13a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5z|M12.75 11V5.5l2 .7'
)
export const PlusIcon = /* @__PURE__ */ createIcon('Plus', 'M8 3v10|M3 8h10')
export const PlusCircleIcon = /* @__PURE__ */ createIcon(
  'PlusCircle',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M8 5.5v5|M5.5 8h5'
)
export const PlusSquareIcon = /* @__PURE__ */ createIcon(
  'PlusSquare',
  'M2.5 2.5h11v11h-11z|M8 5.5v5|M5.5 8h5'
)
export const RadioIcon = /* @__PURE__ */ createIcon(
  'Radio',
  'M2 6.5h12v7H2z|M4.902 6.582l5.453 -4.55|M5.5 11.5a1.75 1.75 0 1 0 0 -3.5a1.75 1.75 0 0 0 0 3.5z|M9.5 9h3|M9.5 11.5h3'
)
export const RectangleIcon = /* @__PURE__ */ createIcon('Rectangle', 'M2 4.5h12v7H2z')
export const RedoIcon = /* @__PURE__ */ createIcon(
  'Redo',
  'M13 8H6a3 3 0 0 0 0 6h4|M10 5l3 3-3 3'
)
export const RefreshIcon = /* @__PURE__ */ createIcon(
  'Refresh',
  'M13.5 8A5.5 5.5 0 1 1 13.44 5.325|M13.8 2.2v3.6h-3.6'
)
export const ReplayIcon = /* @__PURE__ */ createIcon(
  'Replay',
  'M2 8a6 6 0 1 0 2 -4.467L2 5.333|M2 2v3.333h3.333'
)
export const RobotIcon = /* @__PURE__ */ createIcon(
  'Robot',
  'M4 5.5h8v7H4z|M8 3v2.5|M6.5 8.5h.01|M9.5 8.5h.01|M6.5 10.5h3|M2.5 8.5h1.5|M12 8.5h1.5'
)
export const RotateRightIcon = /* @__PURE__ */ createIcon(
  'RotateRight',
  'M13 8A5 5 0 1 1 8 3h2.5|M9 1l2 2-2 2'
)
export const RouteIcon = /* @__PURE__ */ createIcon(
  'Route',
  'M5.029 5.343a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z|M11.327 14.6a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z|M5.029 5.343V7.171A2 2.338 0 0 0 6.817 8.174H9.277A2 2 0 0 1 11.32 9.505V10.554'
)
export const RowsIcon = /* @__PURE__ */ createIcon(
  'Rows',
  'M2.5 3h11v10h-11z|M2.5 6.33h11|M2.5 9.67h11'
)
export const RulerIcon = /* @__PURE__ */ createIcon(
  'Ruler',
  'M1.5 5.5h13v5h-13z|M4 5.5v2|M6.5 5.5v2.5|M9 5.5v2|M11.5 5.5v2.5'
)
export const RunIcon = /* @__PURE__ */ createIcon(
  'Run',
  'M7.481 3.732a1.266 1.266 0 1 0 0 -2.532a1.266 1.266 0 0 0 0 2.532z|M2.424 5.516L4.71 7.701L7.838 5.579L11.716 6.742L10.679 9.818|M8.381 9.87L9.139 12.835L12.43 12.505|M8.054 9.789L4.17 11.462L3.349 14.711|M7.881 6.53L8.393 10.098'
)
export const SaveIcon = /* @__PURE__ */ createIcon(
  'Save',
  'M2.5 2.5h9l2 2v9h-11z|M5 2.5v3.5h5V2.5|M5 13.5v-4h6v4'
)
export const ScissorsIcon = /* @__PURE__ */ createIcon(
  'Scissors',
  'M4 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z|M4 13.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z|M5.6 5.7L14 13|M5.6 10.3L14 3'
)
export const ScribbleIcon = /* @__PURE__ */ createIcon(
  'Scribble',
  'M2 11c2-6 4-6 5-3s-1 5 1 4 2-5 5-4'
)
export const SearchIcon = /* @__PURE__ */ createIcon(
  'Search',
  'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10z|M14 14l-3.5-3.5'
)
export const SearchOffIcon = /* @__PURE__ */ createIcon(
  'SearchOff',
  'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10z|M14 14l-3.5-3.5|M5.2 5.2l3.6 3.6|M8.8 5.2L5.2 8.8'
)
export const SeatIcon = /* @__PURE__ */ createIcon(
  'Seat',
  'M4.5 2.5h3a1.5 1.5 0 0 1 1.5 1.5v4.5H4.5z|M3 9h9a1.5 1.5 0 0 1 1.5 1.5v3H3z'
)
export const SendIcon = /* @__PURE__ */ createIcon(
  'Send',
  'M14 2L7 9|M14 2l-4.5 12-2-5-5-2z'
)
export const ServerIcon = /* @__PURE__ */ createIcon(
  'Server',
  'M3.667 2.667h8.667a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-8.667a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z|M3.667 9.333h8.667a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-8.667a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z|M5.333 4.667h0.007M5.333 11.333h0.007'
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
export const ShareIcon = /* @__PURE__ */ createIcon(
  'Share',
  'M11.5 5.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5z|M4.5 9.75a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5z|M11.5 14a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5z|M6.1 7.1l3.8-2.2|M6.1 8.9l3.8 2.2'
)
export const SkipBackIcon = /* @__PURE__ */ createIcon(
  'SkipBack',
  'M12 3.5v9L5 8z|M3.5 3.5v9'
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
export const SparkleIcon = /* @__PURE__ */ createIcon(
  'Sparkle',
  'M8 1.5l1.4 3.6 3.6 1.4-3.6 1.4L8 11.5 6.6 7.9 3 6.5l3.6-1.4z|M12.6 10.6l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z'
)
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
  'M8 1.667l1.96 4.053l4.373 0.547l-3.22 3.067l0.813 4.333L8 11.513L4.073 13.667l0.813 -4.333l-3.22 -3.067l4.373 -0.547z',
  { filled: true }
)
export const StopIcon = /* @__PURE__ */ createIcon('Stop', 'M3.5 3.5h9v9h-9z')
export const StopCircleIcon = /* @__PURE__ */ createIcon(
  'StopCircle',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M6 6h4v4H6z'
)
export const StrikethroughIcon = /* @__PURE__ */ createIcon(
  'Strikethrough',
  'M4 4.6a3 3 0 0 1 3-2h2a3 3 0 0 1 2.8 2.1|M2.5 8h11|M4.5 11.3a3 3 0 0 0 2.9 2.1h1.6a3 3 0 0 0 2.9-2.1'
)
export const SunIcon = /* @__PURE__ */ createIcon(
  'Sun',
  'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M8 1v1.5|M8 13.5V15|M1 8h1.5|M13.5 8H15|M3 3l1 1|M12 12l1 1|M3 13l1-1|M12 4l1-1'
)
export const SwapHorizontalIcon = /* @__PURE__ */ createIcon(
  'SwapHorizontal',
  'M3 5h10|M10.5 2.5L13 5l-2.5 2.5|M13 11H3|M5.5 8.5L3 11l2.5 2.5'
)
export const SwapVerticalIcon = /* @__PURE__ */ createIcon(
  'SwapVertical',
  'M5 13V3|M2.5 5.5L5 3l2.5 2.5|M11 3v10|M8.5 10.5L11 13l2.5 -2.5'
)
export const SwordIcon = /* @__PURE__ */ createIcon(
  'Sword',
  'M11.522 9.844L14.35 12.673L12.936 14.087L10.107 11.259M12.936 8.43L8.693 12.673M12.229 9.137L6.572 3.48L2.329 2.066L3.743 6.309L9.4 11.966L10.814 10.551L6.572 6.309'
)
export const TargetIcon = /* @__PURE__ */ createIcon(
  'Target',
  'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z|M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'
)
export const TextIcon = /* @__PURE__ */ createIcon(
  'Text',
  'M3 3.5h10|M8 3.5v10|M6 13.5h4'
)
export const TextRotateIcon = /* @__PURE__ */ createIcon(
  'TextRotate',
  'M3 3.5h7|M6.5 3.5v7|M4.5 10.5h4|M11.5 8v5|M10 11.5l1.5 2 1.5-2'
)
export const ThumbDownIcon = /* @__PURE__ */ createIcon(
  'ThumbDown',
  'M5 9H3V2.5h2z|M5 9l2.5 5.5h.5a1.5 1.5 0 0 0 1.5-1.5V9h3a1.2 1.2 0 0 0 1.2-1.5l-1-4A1.5 1.5 0 0 0 11.2 2.5H5z'
)
export const ThumbUpIcon = /* @__PURE__ */ createIcon(
  'ThumbUp',
  'M5 7H3v6.5h2z|M5 7l2.5-5.5h.5a1.5 1.5 0 0 1 1.5 1.5V7h3a1.2 1.2 0 0 1 1.2 1.5l-1 4a1.5 1.5 0 0 1-1.5 1h-6z'
)
export const TimelineIcon = /* @__PURE__ */ createIcon(
  'Timeline',
  'M2.5 2.5v11|M4.5 4h6|M4.5 8h8|M4.5 12h4'
)
export const TimerIcon = /* @__PURE__ */ createIcon(
  'Timer',
  'M8 14A5.5 5.5 0 1 0 8 3a5.5 5.5 0 0 0 0 11z|M8 5.8V8.2l2 1.4|M6.2 1.5h3.6'
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
/** ImportIcon under the name an upload button looks for. */
export const TriangleIcon = /* @__PURE__ */ createIcon('Triangle', 'M8 2.8l5.5 10.4h-11z')
export const TrophyIcon = /* @__PURE__ */ createIcon(
  'Trophy',
  'M5 2.5h6V6a3 3 0 0 1 -6 0z|M5 3.5H3a1.5 1.5 0 0 0 2 2.8|M11 3.5h2a1.5 1.5 0 0 1 -2 2.8|M8 9V13.387|M5.5 13.5h5'
)
export const UnderlineIcon = /* @__PURE__ */ createIcon(
  'Underline',
  'M4.5 2.5V8a3.5 3.5 0 0 0 7 0V2.5|M3.5 13.5h9'
)
export const UndoIcon = /* @__PURE__ */ createIcon(
  'Undo',
  'M3 8h7a3 3 0 0 1 0 6H6|M6 5L3 8l3 3'
)
export const UploadIcon = ImportIcon
export const UserIcon = /* @__PURE__ */ createIcon(
  'User',
  'M8 8a2.75 2.75 0 1 0 0-5.5A2.75 2.75 0 0 0 8 8z|M2.5 14a5.5 5.5 0 0 1 11 0'
)
export const UserMinusIcon = /* @__PURE__ */ createIcon(
  'UserMinus',
  'M6 8a2.75 2.75 0 1 0 0-5.5A2.75 2.75 0 0 0 6 8z|M1 14a5 5 0 0 1 10 0|M11.5 8.5h3.5'
)
export const UsersIcon = /* @__PURE__ */ createIcon(
  'Users',
  'M6 8a2.75 2.75 0 1 0 0-5.5A2.75 2.75 0 0 0 6 8z|M1 14a5 5 0 0 1 10 0|M10.3 3a2.6 2.6 0 0 1 0 4.8|M11.5 9.8a4.2 4.2 0 0 1 3.5 4.2'
)
export const VibrationIcon = /* @__PURE__ */ createIcon(
  'Vibration',
  'M6 3h4v10H6z|M3.5 5.5v5|M1.5 6.5v3|M12.5 5.5v5|M14.5 6.5v3'
)
export const VolumeIcon = /* @__PURE__ */ createIcon(
  'Volume',
  'M2.5 6.2h2L7.5 3.5v9L4.5 9.8h-2z|M10.3 5.8a3.2 3.2 0 0 1 0 4.4|M12.3 3.8a6 6 0 0 1 0 8.4'
)
export const VolumeOffIcon = /* @__PURE__ */ createIcon(
  'VolumeOff',
  'M2.5 6.2h2L7.5 3.5v9L4.5 9.8h-2z|M10.2 6.2l3.6 3.6|M13.8 6.2l-3.6 3.6'
)
export const WandIcon = /* @__PURE__ */ createIcon(
  'Wand',
  'M1.357 14.5L6.802 9.585|M5.67 7.726l3 3|M14.999 5.494l-2.927 1.274l-1.24 2.939l-1.274 -2.927L6.619 5.545l2.927 -1.274L10.783 1.33l1.274 2.927z'
)
export const WarningIcon = /* @__PURE__ */ createIcon(
  'Warning',
  'M8 2.5l5.8 10.5H2.2z|M8 6.5v3|M8 11.4h.01'
)
export const WidthFullIcon = /* @__PURE__ */ createIcon(
  'WidthFull',
  'M2.5 2.5v11|M13.5 2.5v11|M2.5 8h11'
)
export const WidthNormalIcon = /* @__PURE__ */ createIcon(
  'WidthNormal',
  'M5.5 2.5v11|M10.5 2.5v11|M5.5 8h5'
)
export const WidthWideIcon = /* @__PURE__ */ createIcon(
  'WidthWide',
  'M4 2.5v11|M12 2.5v11|M4 8h8'
)
export const WrapTextIcon = /* @__PURE__ */ createIcon(
  'WrapText',
  'M2.5 4h11|M2.5 8h9a2 2 0 0 1 0 4H7|M9 10l-2 2 2 2'
)
export const WrenchIcon = /* @__PURE__ */ createIcon(
  'Wrench',
  'M11.631 2.197A2.794 2.901 0 0 0 6.565 7.042L2.088 11.731A1.222 1.269 0 0 0 4.133 14.451L9.329 9.147A2.794 2.901 0 0 0 13.328 3.467L10.983 6.276L9.423 4.933Z'
)
export const ZoomInIcon = /* @__PURE__ */ createIcon(
  'ZoomIn',
  'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10z|M14 14l-3.5-3.5|M4.5 7h5|M7 4.5v5'
)
export const ZoomOutIcon = /* @__PURE__ */ createIcon(
  'ZoomOut',
  'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10z|M14 14l-3.5-3.5|M4.5 7h5'
)
