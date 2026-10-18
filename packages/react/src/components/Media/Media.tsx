import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import type { Responsive } from '../../utils/responsive.ts'
import { AspectRatio } from '../AspectRatio/AspectRatio.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface VideoProps extends GreeseProps, ComponentPropsWithRef<'video'> {
  /** @default 16 / 9 */
  ratio?: Responsive<number | string>
}

/**
 * A native `<video>` in a ratio frame. Defaults suit phones: `controls`,
 * `playsInline` (no forced fullscreen on iOS) and `preload="metadata"`.
 * Add captions with a `<track kind="captions">` child.
 */
export const Video = ({
  greese,
  ratio = 16 / 9,
  className,
  ...props
}: VideoProps): JSX.Element =>
  withGreese(
    <AspectRatio ratio={ratio} fit="contain" className={cx('greese-Video', className)}>
      <video controls playsInline preload="metadata" {...props} />
    </AspectRatio>,
    greese
  )

export interface EmbedProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'iframe'>, 'title'> {
  /** Required: names the frame for screen readers, e.g. "Product demo video". */
  title: string
  /** @default 16 / 9 */
  ratio?: Responsive<number | string>
}

/**
 * A third-party embed (YouTube, maps, CodePen) in a ratio frame. Lazy-loaded
 * by default, so off-screen embeds cost nothing at page load.
 */
export const Embed = ({
  greese,
  ratio = 16 / 9,
  className,
  ...props
}: EmbedProps): JSX.Element =>
  withGreese(
    <AspectRatio ratio={ratio} className={cx('greese-Embed', className)}>
      <iframe
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        {...props}
      />
    </AspectRatio>,
    greese
  )
