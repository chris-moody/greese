'use client'
import type { JSX, ReactNode } from 'react'
import { BreadcrumbItem, Breadcrumbs as Trail } from '@greese/react'
import { useAuthoringSelector } from '../../environment/environment.tsx'
import { selectNavigationStack } from '../../state/selectors.ts'
import { useNavigation } from '../../hooks/useNavigation.ts'
import { accentStyle } from '../Navigation/accent.ts'

/** How a step of the trail is marked: its environment's icon and hue. */
export interface BreadcrumbAccent {
  /** Drawn before the step's name. */
  icon?: ReactNode
  /** Lights the step with this hue, an OKLCH hue in degrees. */
  hue?: number
}

export interface AuthoringBreadcrumbsProps {
  /** The trail's accessible name. @default 'Subview trail' */
  label?: string
  /** Marks each step, by the asset it opened (`null` for Root): an icon and a hue. */
  accent?: (assetId: string | null) => BreadcrumbAccent
  /** A step before Root, which the host supplies: a button back to where the editor was opened from. */
  leading?: ReactNode
  /** Shows the trail at the top level too, as just Root (and `leading`). */
  showAtRoot?: boolean
}

/**
 * Where the editor is among nested subviews (a symbol opened inside another),
 * hidden at the top level. Each step but the current one is a button back to
 * it: buttons, not links, since the trail moves the editor's own stack, not
 * the page.
 *
 * ```tsx
 * <StageContext breadcrumbs={<AuthoringBreadcrumbs />} />
 * ```
 */
export const AuthoringBreadcrumbs = ({
  label = 'Subview trail',
  accent,
  leading,
  showAtRoot,
}: AuthoringBreadcrumbsProps): JSX.Element | null => {
  const stack = useAuthoringSelector(selectNavigationStack)
  const { navigateTo } = useNavigation()
  if (stack.length === 0 && !showAtRoot) return null

  const step = (name: string, assetId: string | null) => {
    const marks = accent?.(assetId)
    return (
      <span
        className="greese-AuthoringBreadcrumbs-step"
        data-accent={marks?.hue === undefined ? undefined : ''}
        style={accentStyle(marks?.hue)}
      >
        {marks?.icon}
        {name}
      </span>
    )
  }

  const crumb = (name: string, index: number, assetId: string | null) => (
    <BreadcrumbItem key={`${index}-${name}`} asChild>
      <button
        type="button"
        className="greese-AuthoringBreadcrumbs-crumb"
        onClick={() => navigateTo(index)}
      >
        {step(name, assetId)}
      </button>
    </BreadcrumbItem>
  )

  return (
    <Trail label={label} className="greese-AuthoringBreadcrumbs">
      {leading && <BreadcrumbItem asChild>{leading}</BreadcrumbItem>}
      {stack.length === 0 ? (
        <BreadcrumbItem current>{step('Root', null)}</BreadcrumbItem>
      ) : (
        crumb('Root', -1, null)
      )}
      {stack.map((frame, index) =>
        index === stack.length - 1 ? (
          <BreadcrumbItem key={`${index}-${frame.assetId}`} current>
            {step(frame.name, frame.assetId)}
          </BreadcrumbItem>
        ) : (
          crumb(frame.name, index, frame.assetId)
        )
      )}
    </Trail>
  )
}
