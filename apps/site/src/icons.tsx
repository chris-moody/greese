import type { JSX, ReactNode } from 'react'

// GreeseUI ships no icons, so the site draws its own: 24px line icons that
// take the text color, wrapped in <Icon> where they're used.
const Svg = ({ children }: { children: ReactNode }): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
)

export const icons = {
  feather: (
    <Svg>
      <path d="M20 4c-8 0-14 5-15 15l3-3" />
      <path d="M8 16c5 0 9-3 12-12" />
      <path d="M12 12H7" />
    </Svg>
  ),
  layers: (
    <Svg>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </Svg>
  ),
  server: (
    <Svg>
      <rect x="4" y="4" width="16" height="6" rx="1.5" />
      <rect x="4" y="14" width="16" height="6" rx="1.5" />
      <path d="M8 7h.01M8 17h.01" />
    </Svg>
  ),
  access: (
    <Svg>
      <circle cx="12" cy="5" r="1.6" />
      <path d="M5 9h14M12 9v5l-3 6M12 14l3 6" />
    </Svg>
  ),
  phone: (
    <Svg>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </Svg>
  ),
  motion: (
    <Svg>
      <path d="M4 17c3 0 4-10 8-10s5 10 8 10" />
      <path d="M4 21h16" />
    </Svg>
  ),
  copy: (
    <Svg>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </Svg>
  ),
  github: (
    <Svg>
      <path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6.2 0C6.6 2.8 5.6 3.1 5.6 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.2 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
    </Svg>
  ),
  sun: (
    <Svg>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  ),
  moon: (
    <Svg>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </Svg>
  ),
  check: (
    <Svg>
      <path d="m5 12 5 5 9-10" />
    </Svg>
  ),
  dots: (
    <Svg>
      <path d="M5 12h.01M12 12h.01M19 12h.01" />
    </Svg>
  ),
}
