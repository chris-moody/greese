/** Tiny inline icons for stories. SauceUI is icon-agnostic: bring any set. */
const Icon = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
)

export const PlusIcon = () => <Icon d="M8 3v10M3 8h10" />
export const ArrowIcon = () => <Icon d="M3 8h10M9 4l4 4-4 4" />
export const TrashIcon = () => (
  <Icon d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" />
)
export const SearchIcon = () => (
  <Icon d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5" />
)
