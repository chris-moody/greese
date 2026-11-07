import type { ComponentPropsWithRef, JSX, ReactNode } from 'react'
import { cx, IconButton, Popover, Text } from '@greese/react'
import { InfoIcon } from '@greese/icons'
import type { ToolInfo } from '../../core/tools/tools.ts'

export interface ToolOptionsPanelProps extends ComponentPropsWithRef<'div'> {
  /** The active tool: its name heads the panel, and its `description` is behind an About button. */
  tool: Pick<ToolInfo, 'label' | 'description'>
  /** The active tool's options: fields the editor supplies. Nothing, and the panel says so. */
  children?: ReactNode
}

/**
 * The Tool Options panel's body: the active tool's name, an About button for
 * its description, and its settings, which the editor supplies (or a note
 * that it has none). The About button isn't in the panel's tab: a tab is a
 * button, and a button can't hold another. The tab shows the tool's name
 * instead: `renderTabContent: () => tool.label`.
 *
 * ```tsx
 * <ToolOptionsPanel tool={star}>
 *   <NumberField label="Points" value={points} onValueChange={setPoints} />
 * </ToolOptionsPanel>
 * ```
 */
export const ToolOptionsPanel = ({
  tool,
  className,
  children,
  ...props
}: ToolOptionsPanelProps): JSX.Element => (
  <div {...props} className={cx('greese-ToolOptionsPanel', className)}>
    <div className="greese-ToolOptionsPanel-header">
      <Text variant="s2">{tool.label}</Text>
      {tool.description && (
        <Popover
          className="greese-ToolOptionsPanel-about"
          label={`About ${tool.label}`}
          placement="bottom-end"
          trigger={
            <IconButton size="xs" label={`About ${tool.label}`}>
              <InfoIcon />
            </IconButton>
          }
        >
          <Text variant="caption">{tool.description}</Text>
        </Popover>
      )}
    </div>
    {children ?? (
      <Text variant="caption" tone="muted">
        {tool.label} has no options.
      </Text>
    )}
  </div>
)
