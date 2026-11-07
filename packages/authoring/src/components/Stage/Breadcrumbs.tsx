'use client'
import type { JSX } from 'react'
import { BreadcrumbItem, Breadcrumbs as Trail } from '@greese/react'
import { useAuthoringSelector } from '../../environment/environment.tsx'
import { selectNavigationStack } from '../../state/selectors.ts'
import { useNavigation } from '../../hooks/useNavigation.ts'

export interface AuthoringBreadcrumbsProps {
  /** The trail's accessible name. @default 'Subview trail' */
  label?: string
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
}: AuthoringBreadcrumbsProps): JSX.Element | null => {
  const stack = useAuthoringSelector(selectNavigationStack)
  const { navigateTo } = useNavigation()
  if (stack.length === 0) return null

  const crumb = (name: string, index: number) => (
    <BreadcrumbItem key={`${index}-${name}`} asChild>
      <button
        type="button"
        className="greese-AuthoringBreadcrumbs-crumb"
        onClick={() => navigateTo(index)}
      >
        {name}
      </button>
    </BreadcrumbItem>
  )

  return (
    <Trail label={label} className="greese-AuthoringBreadcrumbs">
      {crumb('Root', -1)}
      {stack.map((frame, index) =>
        index === stack.length - 1 ? (
          <BreadcrumbItem key={`${index}-${frame.assetId}`} current>
            {frame.name}
          </BreadcrumbItem>
        ) : (
          crumb(frame.name, index)
        )
      )}
    </Trail>
  )
}
