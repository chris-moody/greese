import type { JSX, SVGProps } from 'react'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /**
   * An accessible name. Without one the icon is decorative (`aria-hidden`):
   * name the button or link around it instead, which is usually better.
   */
  title?: string
  /** Width and height: any CSS length, or a number of pixels. @default '1em' */
  size?: number | string
  /** Line width, in units of the 16 × 16 drawing. @default 1.75 */
  strokeWidth?: number | string
}

export type IconComponent = ((props: IconProps) => JSX.Element) & { displayName: string }

/**
 * Makes an icon component from 16 × 16 line art: one path's `d`, or several
 * separated by `|`. The icon is stroked in `currentColor` and sized to the
 * text around it (1em), so it fits buttons and text with no extra CSS.
 *
 * ```tsx
 * export const KiteIcon = createIcon('Kite', 'M8 1l5 6-5 8-5-8z')
 * ```
 */
export const createIcon = (name: string, d: string): IconComponent => {
  const paths = d.split('|')
  const Icon = ({
    title,
    size = '1em',
    strokeWidth = 1.75,
    style,
    ...props
  }: IconProps) => (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      // Inline, on the text's baseline, so an icon can sit in a sentence;
      // resets that make every svg a block don't stack it on its own line.
      style={{
        display: 'inline-block',
        verticalAlign: '-0.125em',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      {title && <title>{title}</title>}
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  )
  Icon.displayName = `${name}Icon`
  return Icon
}
