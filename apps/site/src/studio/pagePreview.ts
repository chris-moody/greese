/**
 * A theme's page transitions where the editor can play them (the Motion
 * tab's stage, ADR 0029): the page roles as the custom properties the kit's
 * `motion-defaults()` writes, and the page rules as `PageTransition`'s
 * `rules`. The stage sets the properties on the editor's root while it's
 * shown: a view transition's snapshots inherit from the root, and nowhere
 * else.
 */
import type { PageRule } from '@greese/react'
import type { PageRuleSpec, ThemeSpec } from './spec.ts'

const ENTRANCE_ROLES = new Set(['page', 'page-back'])
const EXIT_ROLES = new Set(['page-exit', 'page-back-exit'])
const DURATIONS = new Set(['fast', 'normal', 'slow'])
const EASING_TOKENS = new Set(['standard', 'enter', 'exit'])
const NAMED_EASES = /^(linear|ease|ease-in|ease-out|ease-in-out|in|out|in-out)$/

/** A duration role's CSS: a token by name, else the time as written. */
const duration = (value: string) =>
  DURATIONS.has(value) ? `var(--greese-duration-${value})` : value

/** An ease role's CSS: an easing token, a named ease, else the curve as written. */
const ease = (value: string) =>
  EASING_TOKENS.has(value)
    ? `var(--greese-easing-${value})`
    : NAMED_EASES.test(value)
      ? `var(--greese-ease-${value})`
      : value

/** The page roles as custom properties, as `motion-defaults()` writes them. */
export const pageRoleVars = (spec: ThemeSpec): Record<string, string> =>
  Object.fromEntries(
    Object.entries(spec.motionDefaults ?? {}).flatMap(([role, value]) => {
      if (!/^(page|share)(-|$)/.test(role) || !value) return []
      const css =
        ENTRANCE_ROLES.has(role) || EXIT_ROLES.has(role)
          ? value === 'none'
            ? 'none'
            : `greese-${value}`
          : role.endsWith('-duration')
            ? duration(value)
            : role.endsWith('-ease')
              ? ease(value)
              : value
      return [[`--greese-motion-${role}`, css]]
    })
  )

const camel = (kebab: string) =>
  kebab.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

/** Seconds from a time as written (`0.3s`, `300ms`), for `PageTransition`'s numbers. */
const seconds = (time: string) =>
  time.endsWith('ms') ? parseFloat(time) / 1000 : parseFloat(time)

/** The spec's page rules as `PageTransition`'s `rules`. */
export const pageRules = (spec: ThemeSpec): Record<string, PageRule> =>
  Object.fromEntries(
    Object.entries(spec.pageRules ?? {}).map(
      ([selector, rule]: [string, PageRuleSpec]) => {
        if (rule === 'still') return [selector, 'still']
        const out: Record<string, unknown> = {}
        if (rule.enter) out.enter = rule.enter === 'none' ? 'none' : camel(rule.enter)
        if (rule.exit) out.exit = rule.exit === 'none' ? 'none' : camel(rule.exit)
        if (rule.duration)
          out.duration = DURATIONS.has(rule.duration)
            ? rule.duration
            : seconds(rule.duration)
        if (rule.delay) out.delay = seconds(rule.delay)
        if (rule.ease) out.ease = rule.ease
        return [selector, out as PageRule]
      }
    )
  )
