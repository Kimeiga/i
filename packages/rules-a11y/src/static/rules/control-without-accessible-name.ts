import { Node } from 'ts-morph'
import type { RawFinding, Rule } from '@attestci/core'
import {
  attributeIsTruthy,
  descendantTags,
  elementOf,
  excerpt,
  getJsxTags,
  hasAttribute,
  hasSpreadAttributes,
  isTag,
  locationOf,
  staticTextContent,
  tagName,
  type StaticContext,
} from '@attestci/core/static'
import { WCAG } from '../../wcag.js'

/**
 * An icon-only button or link with nothing to announce.
 *
 * axe catches this at runtime, and catches it better. This rule exists because
 * it catches the same thing in the pull request that introduces it, on a
 * component that may not be reachable from any URL the CI job renders — and
 * because the fix is unambiguous, which makes it a safe thing to report early.
 *
 * What separates it from `jsx-a11y/control-has-associated-label` is that it
 * understands a component child: `<button><TrashIcon /></button>` has no text,
 * and a rule that only reads JSX text nodes has to guess.
 */

const ICON_LIKE = /(icon|glyph|symbol)$/i

const rule: Rule<StaticContext> = {
  id: 'a11y/control-without-accessible-name',
  kind: 'static-a11y',
  title: 'Icon-only control has no accessible name',
  description:
    'A button or link whose only content is an icon — an <svg>, or a component whose name ends in ' +
    'Icon — and which carries no aria-label, title or visually hidden text. Assistive technology ' +
    'announces it as "button" with no indication of what it does.',
  severity: 'serious',
  docs: 'a11y-control-without-accessible-name',
  standards: [WCAG.nameRoleValue, WCAG.linkPurpose],
  fixtures: {
    triggering: ['fixtures/a11y-static/control-without-accessible-name/triggering.tsx'],
    clean: ['fixtures/a11y-static/control-without-accessible-name/clean.tsx'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      for (const tag of getJsxTags(file)) {
        if (!isTag(tag, 'button', 'a')) continue
        // `<a>` without href is not a control at all; axe and the browser both
        // treat it as text.
        if (isTag(tag, 'a') && !hasAttribute(tag, 'href')) continue
        // Spread props may carry aria-label; we cannot prove otherwise.
        if (hasSpreadAttributes(tag)) continue
        if (hasAttribute(tag, 'aria-label') || hasAttribute(tag, 'aria-labelledby') || hasAttribute(tag, 'title')) {
          continue
        }

        const element = elementOf(tag)
        const text = staticTextContent(element)
        // `undefined` means the content is dynamic, so it may well have text.
        if (text === undefined || text.length > 0) continue

        const children = Node.isJsxElement(element) ? descendantTags(element) : []
        const iconOnly = children.length > 0 && children.every((child) => isIconLike(child))
        if (!iconOnly) continue

        findings.push({
          message:
            `This <${tagName(tag)}> contains only ${children.map((c) => `<${tagName(c)}>`).join(', ')} ` +
            `and exposes no name, so it is announced as "${tagName(tag) === 'a' ? 'link' : 'button'}".`,
          location: locationOf(tag, ctx.rootDir),
          evidence: excerpt(element, 160),
          help:
            'Add an aria-label describing the action, or include visually hidden text inside the ' +
            'control. Mark the icon aria-hidden so it is not announced twice.',
          surface: ctx.relative(file),
        })
      }
    }

    return findings
  },
}

function isIconLike(tag: Parameters<typeof tagName>[0]): boolean {
  const name = tagName(tag)
  if (name === 'svg' || name === 'img' || name === 'path' || name === 'circle' || name === 'rect') return true
  if (ICON_LIKE.test(name)) return true
  // An element explicitly hidden from assistive technology contributes no name.
  return attributeIsTruthy(tag, 'aria-hidden')
}

export default rule
