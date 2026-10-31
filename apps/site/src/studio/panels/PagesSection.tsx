import { useState, type JSX } from 'react'
import { Button, Heading, Stack, Switch, Text, TextField } from '@greese/react'
import { setIn } from '../edit.ts'
import { ValueRow } from '../fields.tsx'
import { PAGE_RULE_KEYS, type PageRuleSpec, type ThemeSpec } from '../spec.ts'

/** A page transition's roles (ADR 0029), with the base theme's choice. */
const PAGE_ROLES = [
  ['page', 'fade-in'],
  ['page-exit', 'fade-out'],
  ['page-back', 'page’s'],
  ['page-back-exit', 'page-exit’s'],
  ['page-duration', 'normal'],
  ['page-ease', 'the library’s ease out'],
  ['page-stagger', 'the entrance stagger'],
  ['page-exit-order', 'reverse'],
  ['page-mode', 'auto'],
  ['share-duration', 'page-duration’s'],
  ['share-ease', 'page-ease’s'],
] as const

/** What a rule's fields fall back to: the theme's page roles. */
const RULE_PLACEHOLDERS: Record<(typeof PAGE_RULE_KEYS)[number], string> = {
  enter: 'the page’s entrance',
  exit: 'the page’s exit',
  duration: 'the page’s',
  delay: '0s',
  ease: 'the page’s',
}

interface PagesSectionProps {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
}

/**
 * How pages change in this theme: the page roles, and selector rules for
 * parts of a page with motion of their own (the kit's `page-transitions()`).
 * The preview's "Page transition" plays them.
 */
export const PagesSection = ({ spec, onChange }: PagesSectionProps): JSX.Element => {
  const [draft, setDraft] = useState('')
  const rules = Object.entries(spec.pageRules ?? {})
  const setRule = (selector: string, rule: PageRuleSpec | undefined) =>
    onChange(setIn(spec, ['pageRules', selector], rule))
  const add = () => {
    const selector = draft.trim()
    if (!selector || spec.pageRules?.[selector] !== undefined) return
    setRule(selector, {})
    setDraft('')
  }
  return (
    <Stack gap={2}>
      <Heading level={3} variant="h6">
        Pages
      </Heading>
      <Text variant="p3" tone="muted">
        How a page change plays (<code>PageTransition</code>): the new page’s entrance and
        the old page’s exit, going forward and back, by effect name or <code>none</code>.
        A live page’s members leave one after another, in <code>page-exit-order</code>,{' '}
        <code>page-stagger</code> apart; <code>page-mode</code> is <code>auto</code>,{' '}
        <code>snapshot</code> or <code>live</code>.
      </Text>
      {PAGE_ROLES.map(([key, placeholder]) => (
        <ValueRow
          key={key}
          label={key}
          placeholder={placeholder}
          value={spec.motionDefaults?.[key] ?? ''}
          onChange={(v) => onChange(setIn(spec, ['motionDefaults', key], v))}
        />
      ))}
      <Heading level={4} variant="h6">
        Parts of a page
      </Heading>
      <Text variant="p3" tone="muted">
        A selector’s elements get motion of their own while the page changes: kept still
        (a header the change leaves alone), or their own entrance, exit and pace. Each is
        a snapshot of its own, so name sections, not every item of a list.
      </Text>
      {rules.map(([selector, rule]) => (
        <Stack key={selector} gap={2} className="studio-page-rule">
          <div className="studio-row">
            <code className="studio-row-label">{selector}</code>
            <div className="studio-pair">
              <Switch
                label="Still"
                checked={rule === 'still'}
                onChange={(e) =>
                  setRule(selector, e.currentTarget.checked ? 'still' : {})
                }
              />
              <Button
                size="sm"
                variant="ghost"
                tone="neutral"
                aria-label={`Remove ${selector}`}
                onClick={() => setRule(selector, undefined)}
              >
                Remove
              </Button>
            </div>
          </div>
          {rule !== 'still' &&
            PAGE_RULE_KEYS.map((key) => (
              <ValueRow
                key={key}
                label={key}
                placeholder={RULE_PLACEHOLDERS[key]}
                value={rule[key] ?? ''}
                onChange={(v) =>
                  // A field emptied leaves the rule, even an empty one, in place.
                  setRule(
                    selector,
                    v
                      ? { ...rule, [key]: v }
                      : (({ [key]: _gone, ...rest }) => rest)(rule)
                  )
                }
              />
            ))}
        </Stack>
      ))}
      <form
        className="studio-add"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <TextField
          label="Add a part of the page"
          hideLabel
          size="sm"
          placeholder="Add a selector: header, .greese-Card, [data-hero]…"
          value={draft}
          spellCheck={false}
          onChange={(e) => setDraft(e.currentTarget.value)}
        />
        <Button size="sm" variant="soft" type="submit">
          Add
        </Button>
      </form>
    </Stack>
  )
}
